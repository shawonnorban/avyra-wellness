<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public storefront endpoint
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['required', 'string', 'max:1000'],
            'delivery_zone' => ['required', 'in:inside_dhaka,outside_dhaka'],
            'notes' => ['nullable', 'string', 'max:1000'],

            'payment_method' => ['required', 'string', 'max:30'],
            'payment_sender_number' => ['nullable', 'string', 'max:32'],
            'payment_txn_ref' => ['nullable', 'string', 'max:64'],

            'coupon_code' => ['nullable', 'string', 'max:64'],
            'otp_code' => ['nullable', 'string', 'max:10'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'uuid', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],

            // Prices are never taken from the client; only these tracking fields are.
            'device_fingerprint' => ['nullable', 'string', 'max:255'],
            'landing_url' => ['nullable', 'string', 'max:2000'],
            'referrer' => ['nullable', 'string', 'max:2000'],
            'utm_source' => ['nullable', 'string', 'max:255'],
            'utm_medium' => ['nullable', 'string', 'max:255'],
            'utm_campaign' => ['nullable', 'string', 'max:255'],
            'utm_term' => ['nullable', 'string', 'max:255'],
            'utm_content' => ['nullable', 'string', 'max:255'],
            'utm_id' => ['nullable', 'string', 'max:255'],
            'fbclid' => ['nullable', 'string', 'max:255'],
            'fbc' => ['nullable', 'string', 'max:255'],
            'fbp' => ['nullable', 'string', 'max:255'],
            'landing_page_slug' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Your cart is empty.',
            'delivery_zone.in' => 'Please choose a delivery zone.',
        ];
    }
}
