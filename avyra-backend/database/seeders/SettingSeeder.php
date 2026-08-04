<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Default configuration. Anything marked public is readable by the storefront
     * without auth; credentials must never be marked public.
     */
    public function run(): void
    {
        $defaults = [
            ['company', [
                'name' => 'Avyra Wellness',
                'tagline' => 'Guided by Nature',
                'slogan' => 'Bringing nature back to everyday life',
                // Promotional ticker above the storefront header; blank hides the bar.
                'scroll_text' => '',
                'email' => 'support@avyrabd.com',
                'phone' => '',
                'whatsapp' => '',
                'messenger' => '',
                'address' => '',
                // Upload path, not a URL — see App\Support\Media.
                'logo_path' => null,
                'currency' => 'BDT',
                'currency_symbol' => '৳',
                'social' => ['facebook' => '', 'instagram' => '', 'youtube' => '', 'tiktok' => ''],
            ], true],

            ['delivery', [
                'inside_dhaka_charge' => 70,
                'outside_dhaka_charge' => 130,
                'free_delivery_above' => null,
                // A flat amount taken off the delivery charge, shown as its own line.
                // Capped at the charge itself, so delivery never goes negative.
                'delivery_discount_enabled' => false,
                'delivery_discount' => 0,
            ], true],

            // Storefront policy pages. Public so /returns-policy and friends can
            // render without an authenticated request.
            ['policies', [
                'returns' => "We accept returns within 7 days of delivery if the seal is intact.\n\n"
                    . "To start a return, call or WhatsApp us with your order number. Once the product "
                    . "reaches us in resalable condition, the refund is issued to the same channel you paid with.",
                'shipping' => "Orders inside Dhaka are delivered in 1–2 working days; elsewhere in Bangladesh "
                    . "in 2–3 working days.\n\nDelivery charges are shown at checkout before you confirm. "
                    . "Cash on delivery is available nationwide.",
                'terms' => "By ordering from this store you confirm the details you provide are accurate.\n\n"
                    . "Prices and offers may change without notice. Vital Plus is a food supplement, not a "
                    . "medicine, and is intended for adults.",
                'privacy' => "We collect only what is needed to deliver your order: name, phone number and "
                    . "address.\n\nWe never sell your data. Your phone number is shared with our courier "
                    . "partner solely to complete delivery.",
            ], true],

            // Social-proof popup on the campaign pages. Public so the storefront can
            // read it; the entries are staff-written, never real customer records.
            ['purchase_popup', [
                'enabled' => false,
                'interval_seconds' => 25,
                'entries' => "মহিউদ্দিন | টাঙ্গাইল\nরাকিব হাসান | চট্টগ্রাম\nসাইফুল ইসলাম | রাজশাহী\nআরিফ হোসেন | সিলেট\nজাহিদুল ইসলাম | খুলনা",
            ], true],

            ['payment', [
                'cod_enabled' => true,
                'bkash_number' => '',
                'nagad_number' => '',
                'rocket_number' => '',
            ], true],

            ['pixels', [
                'facebook_pixel_id' => '',
                'tiktok_pixel_id' => '',
                'gtag_id' => '',
            ], true],

            // Server-side only — the Conversions API access token must not reach the browser.
            ['meta_capi', [
                'enabled' => false,
                'pixel_id' => '',
                'access_token' => '',
                'test_event_code' => '',
            ], false],

            ['fraud_detection', [
                'enabled' => true,
                'phone_block_minutes' => 60,
                'ip_block_minutes' => 30,
                'device_fingerprinting' => true,
                'min_phone_digits' => 11,
                'min_address_length' => 15,
                'delivery_success_threshold' => 40, // block below this % success rate
                'block_message' => 'দুঃখিত, আপনার অর্ডারটি এই মুহূর্তে সম্পন্ন করা যাচ্ছে না। সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।',
            ], false],

            ['courier_steadfast', [
                'enabled' => false,
                'base_url' => 'https://portal.packzy.com/api/v1',
                'api_key' => '',
                'secret_key' => '',
                'webhook_token' => '',
                'auto_sync' => true,
            ], false],

            ['sms', [
                'provider' => 'bulksmsbd',
                'api_key' => '',
                'sender_id' => '',
                'otp_template' => 'Your Avyra verification code is {otp}',
                'otp_expiry_minutes' => 5,
                'otp_max_attempts' => 5,
            ], false],

            ['order', [
                'require_otp' => false,
                'auto_confirm' => false,
            ], false],
        ];

        foreach ($defaults as [$key, $value, $isPublic]) {
            $setting = Setting::firstWhere('key', $key);

            if (! $setting) {
                Setting::create(['key' => $key, 'value' => $value, 'is_public' => $isPublic]);

                continue;
            }

            // Backfill keys added since this row was created, without touching any
            // value an admin has already set. Re-running the seeder is therefore
            // safe and picks up new settings.
            $merged = array_merge($value, $setting->value ?? []);

            if ($merged !== $setting->value) {
                $setting->update(['value' => $merged]);
            }
        }
    }
}
