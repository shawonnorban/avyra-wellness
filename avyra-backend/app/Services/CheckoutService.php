<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Campaign;
use App\Models\CampaignVisit;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\LandingPage;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutService
{
    public function __construct(private readonly StockService $stock) {}

    /**
     * Turns a validated checkout payload into a customer + order + items.
     *
     * Prices, delivery charges and discounts are all resolved server-side from the
     * database; nothing monetary is trusted from the request body.
     */
    public function place(array $data, ?string $ip = null, ?string $userAgent = null): Order
    {
        $phone = preg_replace('/\D/', '', $data['phone']) ?? '';

        return DB::transaction(function () use ($data, $phone, $ip, $userAgent) {
            $lines = $this->resolveLines($data['items']);
            $subtotal = array_sum(array_map(fn ($l) => $l['unit_price'] * $l['quantity'], $lines));

            $deliveryCharge = $this->deliveryCharge(
                $data['delivery_zone'],
                $subtotal,
                $data['landing_page_slug'] ?? null,
            );

            [$discount, $coupon] = $this->resolveCoupon($data['coupon_code'] ?? null, $subtotal);

            $customer = $this->findOrCreateCustomer($data, $phone);

            $order = Order::create([
                'customer_id' => $customer->id,
                'customer_name' => $data['customer_name'],
                'phone' => $phone,
                'address' => $data['address'],
                'items_count' => array_sum(array_column($lines, 'quantity')),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'delivery_charge' => $deliveryCharge,
                'coupon_code' => $coupon?->code,
                'delivery_zone' => $data['delivery_zone'],
                'total' => round($subtotal - $discount + $deliveryCharge, 2),
                'status' => $this->initialStatus(),
                'order_source' => isset($data['landing_page_slug']) ? 'Landing Page' : 'Website',
                'payment_method' => $data['payment_method'],
                'payment_sender_number' => $data['payment_sender_number'] ?? null,
                'payment_txn_ref' => $data['payment_txn_ref'] ?? null,
                'notes' => $data['notes'] ?? null,
                'ip_address' => $ip,
                'user_agent' => $userAgent ? mb_substr($userAgent, 0, 512) : null,
                'device_fingerprint' => $data['device_fingerprint'] ?? null,
                'landing_url' => $data['landing_url'] ?? null,
                'referrer' => $data['referrer'] ?? null,
                'utm_source' => $data['utm_source'] ?? null,
                'utm_medium' => $data['utm_medium'] ?? null,
                'utm_campaign' => $data['utm_campaign'] ?? null,
                'utm_term' => $data['utm_term'] ?? null,
                'utm_content' => $data['utm_content'] ?? null,
                'utm_id' => $data['utm_id'] ?? null,
                'fbclid' => $data['fbclid'] ?? null,
                'fbc' => $data['fbc'] ?? null,
                'fbp' => $data['fbp'] ?? null,
            ]);

            foreach ($lines as $line) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $line['product']->id,
                    'variant_id' => $line['variant']?->id,
                    'product_name' => $line['product']->name,
                    'variant_label' => $line['variant_label'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                ]);

                $this->stock->deductForOrder(
                    $line['product'],
                    $line['quantity'],
                    $order->id,
                    $line['variant'],
                );
            }

            if ($coupon) {
                $coupon->increment('current_usage');
            }

            $customer->refreshOrderStats();

            $this->recordCampaignConversion($data['landing_page_slug'] ?? null, $data);

            Notification::create([
                'type' => 'order',
                'title' => 'New order received',
                'message' => "{$order->order_number} — {$order->customer_name} (৳" . number_format((float) $order->total, 2) . ')',
                'link' => '/admin/orders/' . $order->id,
                'metadata' => ['order_id' => $order->id],
            ]);

            return $order->load('items');
        });
    }

    /**
     * Looks each line up in the database and takes the authoritative price from there.
     *
     * @return array<int, array{product: Product, variant: ?ProductVariant, variant_label: ?string, quantity: int, unit_price: float}>
     */
    private function resolveLines(array $items): array
    {
        $lines = [];

        foreach ($items as $item) {
            $product = Product::where('is_active', true)->findOrFail($item['product_id']);

            $variant = null;
            $variantLabel = null;
            $unitPrice = (float) $product->sell_price;

            if (! empty($item['variant_id'])) {
                $variant = ProductVariant::where('product_id', $product->id)
                    ->where('is_active', true)
                    ->findOrFail($item['variant_id']);

                $unitPrice = (float) $variant->sell_price;
                $variantLabel = trim(implode(' / ', array_filter([$variant->size, $variant->color]))) ?: null;
            }

            $lines[] = [
                'product' => $product,
                'variant' => $variant,
                'variant_label' => $variantLabel,
                'quantity' => (int) $item['quantity'],
                'unit_price' => $unitPrice,
            ];
        }

        return $lines;
    }

    /**
     * A landing page may override the store-wide delivery charges for its campaign.
     */
    private function deliveryCharge(string $zone, float $subtotal, ?string $landingSlug): float
    {
        $config = array_merge(
            ['inside_dhaka_charge' => 70, 'outside_dhaka_charge' => 130, 'free_delivery_above' => null],
            Setting::get('delivery', []) ?: [],
        );

        $inside = (float) $config['inside_dhaka_charge'];
        $outside = (float) $config['outside_dhaka_charge'];

        if ($landingSlug) {
            $page = LandingPage::published()->where('slug', $landingSlug)->first();

            if ($page?->delivery_charge_inside !== null) {
                $inside = (float) $page->delivery_charge_inside;
            }
            if ($page?->delivery_charge_outside !== null) {
                $outside = (float) $page->delivery_charge_outside;
            }
        }

        $threshold = $config['free_delivery_above'];
        if ($threshold !== null && $subtotal >= (float) $threshold) {
            return 0.0;
        }

        $charge = $zone === 'inside_dhaka' ? $inside : $outside;

        // A flat promotional discount off delivery, never taking the charge below zero.
        if (! empty($config['delivery_discount_enabled'])) {
            $charge = max(0.0, $charge - (float) ($config['delivery_discount'] ?? 0));
        }

        return $charge;
    }

    /**
     * @return array{0: float, 1: ?Coupon}
     */
    private function resolveCoupon(?string $code, float $subtotal): array
    {
        if (! $code) {
            return [0.0, null];
        }

        $coupon = Coupon::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])->first();

        // An invalid coupon silently yields no discount rather than failing the order;
        // the storefront validates it separately before submit so the customer sees why.
        if (! $coupon || ! $coupon->isRedeemable($subtotal)) {
            return [0.0, null];
        }

        return [$coupon->discountFor($subtotal), $coupon];
    }

    private function findOrCreateCustomer(array $data, string $phone): Customer
    {
        $customer = Customer::where('phone', $phone)->first();

        if ($customer) {
            // Keep the latest address on file without overwriting a name they set before.
            $customer->update(['address' => $data['address']]);

            return $customer;
        }

        return Customer::create([
            'code' => 'CUS-' . strtoupper(Str::random(8)),
            'name' => $data['customer_name'],
            'type' => 'Guest',
            'phone' => $phone,
            'email' => $data['email'] ?? null,
            'address' => $data['address'],
        ]);
    }

    private function initialStatus(): OrderStatus
    {
        $config = Setting::get('order', []) ?: [];

        return ! empty($config['auto_confirm']) ? OrderStatus::Confirm : OrderStatus::Pending;
    }

    private function recordCampaignConversion(?string $landingSlug, array $data): void
    {
        if (! $landingSlug) {
            return;
        }

        $page = LandingPage::published()->where('slug', $landingSlug)->first();

        if (! $page) {
            return;
        }

        CampaignVisit::create([
            'campaign_id' => $page->campaign_id,
            'landing_page_id' => $page->id,
            'event_type' => 'order',
            'utm_source' => $data['utm_source'] ?? null,
            'utm_medium' => $data['utm_medium'] ?? null,
            'utm_campaign' => $data['utm_campaign'] ?? null,
        ]);

        if ($page->campaign_id) {
            Campaign::whereKey($page->campaign_id)->increment('conversions');
        }
    }
}
