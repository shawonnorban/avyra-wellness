<?php

namespace App\Rules;

use App\Services\UploadService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * An image field must reference a file this application stored through the upload
 * endpoint. Pasting an external URL is rejected, so image content can never be
 * hot-linked from — or leak referrer data to — a third-party host.
 */
class StoredImagePath implements ValidationRule
{
    public function __construct(private readonly UploadService $uploads = new UploadService()) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (blank($value)) {
            return;
        }

        if (! is_string($value) || ! $this->uploads->isRegisteredPath($value)) {
            $fail('The :attribute must be an uploaded image. Paste-in image links are not accepted.');
        }
    }
}
