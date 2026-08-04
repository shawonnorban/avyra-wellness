<?php

namespace App\Services\Courier;

use App\Enums\OrderStatus;
use App\Models\CourierConsignment;
use App\Models\CourierReturn;
use App\Models\CourierStatusLog;
use App\Models\CustomerRiskProfile;
use App\Models\Notification;
use App\Models\Order;
use App\Services\StockService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CourierService
{
    public function __construct(
        private readonly SteadfastClient $steadfast,
        private readonly StockService $stock,
    ) {}

    /**
     * Sends an order to Steadfast and records the consignment.
     */
    public function dispatch(Order $order, ?string $note = null): CourierConsignment
    {
        if (! in_array($order->status, OrderStatus::dispatchable(), true)) {
            throw new RuntimeException("Order {$order->order_number} is [{$order->status->value}]; confirm it before dispatch.");
        }

        if ($order->consignments()->whereNot('status', CourierStatus::CANCELLED)->exists()) {
            throw new RuntimeException("Order {$order->order_number} has already been dispatched.");
        }

        // COD is the full payable amount unless the customer already paid online.
        $codAmount = strtoupper((string) $order->payment_method) === 'COD' ? (float) $order->total : 0.0;

        $response = $this->steadfast->createOrder([
            'invoice' => $order->order_number,
            'recipient_name' => $order->customer_name,
            'recipient_phone' => $order->phone,
            'recipient_address' => $order->address,
            'cod_amount' => $codAmount,
            'note' => $note ?? $order->notes,
        ]);

        $consignmentData = $response['consignment'] ?? [];

        return DB::transaction(function () use ($order, $consignmentData, $codAmount, $note) {
            $consignment = CourierConsignment::create([
                'order_id' => $order->id,
                'courier' => 'steadfast',
                'consignment_id' => isset($consignmentData['consignment_id']) ? (string) $consignmentData['consignment_id'] : null,
                'tracking_code' => $consignmentData['tracking_code'] ?? null,
                'invoice' => $order->order_number,
                'status' => CourierStatus::fromSteadfast($consignmentData['status'] ?? 'pending'),
                'cod_amount' => $codAmount,
                'recipient_name' => $order->customer_name,
                'recipient_phone' => $order->phone,
                'recipient_address' => $order->address,
                'note' => $note,
                'last_synced_at' => now(),
            ]);

            $this->log($consignment, $consignment->status, $consignmentData['status'] ?? null, 'manual', 'Dispatched from admin');

            // The order stays `confirm`. Dispatch is a courier fact, recorded on
            // the consignment; the order only moves again when it settles.

            return $consignment;
        });
    }

    /**
     * Pulls the latest status for one consignment and applies it.
     */
    public function sync(CourierConsignment $consignment): CourierConsignment
    {
        $response = $consignment->consignment_id
            ? $this->steadfast->trackByConsignmentId($consignment->consignment_id)
            : $this->steadfast->trackByInvoice((string) $consignment->invoice);

        $raw = $response['delivery_status'] ?? $response['status'] ?? null;

        $consignment->update(['last_synced_at' => now()]);

        return $this->applyStatus($consignment, CourierStatus::fromSteadfast($raw), $raw, 'sync');
    }

    /**
     * Applies a status from either the sync job or the webhook. Idempotent:
     * re-delivering the same status does nothing beyond touching last_synced_at.
     */
    public function applyStatus(
        CourierConsignment $consignment,
        string $status,
        ?string $rawStatus = null,
        string $source = 'sync',
        ?string $note = null,
    ): CourierConsignment {
        if ($consignment->status === $status) {
            return $consignment;
        }

        return DB::transaction(function () use ($consignment, $status, $rawStatus, $source, $note) {
            $consignment->status = $status;

            if ($status === CourierStatus::DELIVERED && ! $consignment->delivered_at) {
                $consignment->delivered_at = now();
            }

            if ($status === CourierStatus::RETURNED && ! $consignment->returned_at) {
                $consignment->returned_at = now();
            }

            $consignment->save();

            $this->log($consignment, $status, $rawStatus, $source, $note);

            $order = $consignment->order;

            if ($order && ($orderStatus = CourierStatus::toOrderStatus($status))) {
                $order->update(['status' => $orderStatus]);

                // The buyer's delivery history is what the fraud check reads, so it has
                // to be refreshed the moment an order settles.
                if ($orderStatus->isTerminal() && $order->phone) {
                    CustomerRiskProfile::recomputeFor($order->phone);
                }
            }

            if ($status === CourierStatus::RETURNED) {
                $this->handleReturn($consignment);
            }

            return $consignment;
        });
    }

    /**
     * Opens a return record and puts the goods back into stock exactly once.
     */
    public function handleReturn(CourierConsignment $consignment, ?string $reason = null): CourierReturn
    {
        $return = CourierReturn::firstOrCreate(
            ['consignment_id' => $consignment->id],
            [
                'order_id' => $consignment->order_id,
                'return_date' => now()->toDateString(),
                'return_reason' => $reason ?? 'Returned by courier',
            ],
        );

        if ($return->stock_restored) {
            return $return;
        }

        $order = $consignment->order?->load('items.product', 'items.variant');

        foreach ($order?->items ?? [] as $item) {
            if (! $item->product) {
                continue;
            }

            $this->stock->restoreForOrder(
                $item->product,
                $item->quantity,
                $order->id,
                $item->variant,
                "Courier return for {$order->order_number}",
            );
        }

        $return->update(['stock_restored' => true]);

        Notification::create([
            'type' => 'courier',
            'title' => 'Order returned',
            'message' => ($order?->order_number ?? $consignment->invoice) . ' was returned; stock has been restored.',
            'link' => $order ? '/admin/orders/' . $order->id : '/admin/courier',
            'metadata' => ['consignment_id' => $consignment->id],
        ]);

        return $return;
    }

    private function log(
        CourierConsignment $consignment,
        string $status,
        ?string $rawStatus,
        string $source,
        ?string $note = null,
    ): CourierStatusLog {
        return CourierStatusLog::create([
            'consignment_id' => $consignment->id,
            'status' => $status,
            'raw_status' => $rawStatus,
            'source' => $source,
            'note' => $note,
            'logged_at' => now(),
        ]);
    }
}
