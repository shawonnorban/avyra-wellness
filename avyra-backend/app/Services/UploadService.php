<?php

namespace App\Services;

use App\Models\Upload;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

class UploadService
{
    /** Folders the admin may upload into, with the longest edge each is resized to. */
    public const FOLDERS = [
        'products' => 1600,
        'banners' => 2000,
        'landing' => 1600,
        'reviews' => 1200,
        'logos' => 600,
        'avatars' => 400,
    ];

    private const THUMBNAIL_WIDTH = 320;

    /** What the app would like to allow, before the PHP host has its say. */
    private const PREFERRED_MAX_BYTES = 5 * 1024 * 1024;

    /**
     * The largest file that can actually get through, which is the smaller of our
     * own cap and PHP's `upload_max_filesize`. Advertising more than PHP permits
     * produces a bare "failed to upload" with no usable explanation.
     */
    public static function maxBytes(): int
    {
        $phpLimit = self::parseIniBytes((string) ini_get('upload_max_filesize'));

        return $phpLimit > 0 ? min(self::PREFERRED_MAX_BYTES, $phpLimit) : self::PREFERRED_MAX_BYTES;
    }

    /** Converts an ini shorthand value such as "2M" or "512K" into bytes. */
    private static function parseIniBytes(string $value): int
    {
        $value = trim($value);

        if ($value === '') {
            return 0;
        }

        $number = (int) $value;

        return match (strtolower(substr($value, -1))) {
            'g' => $number * 1024 ** 3,
            'm' => $number * 1024 ** 2,
            'k' => $number * 1024,
            default => $number,
        };
    }

    public function __construct(private readonly ImageManager $images = new ImageManager(new Driver())) {}

    /**
     * Stores an uploaded image, downscaling it and writing a thumbnail alongside.
     * Returns the registry row; callers persist `$upload->path`.
     */
    public function store(UploadedFile $file, string $folder, ?string $userId = null): Upload
    {
        $maxEdge = self::FOLDERS[$folder] ?? 1600;

        // Re-encode rather than storing the original bytes: it strips EXIF (which can
        // carry GPS data) and guarantees the file really is an image.
        $image = $this->images->decodePath($file->getRealPath());

        if (max($image->width(), $image->height()) > $maxEdge) {
            $image->scaleDown($maxEdge, $maxEdge);
        }

        $basename = Str::uuid()->toString();
        $directory = $folder . '/' . now()->format('Y/m');

        $path = "{$directory}/{$basename}.webp";
        $thumbnailPath = "{$directory}/{$basename}_thumb.webp";

        $disk = Storage::disk('public');
        $disk->put($path, (string) $image->encode(new WebpEncoder(quality: 82, strip: true)));

        // scaleDown mutates the instance, so record the stored dimensions before
        // shrinking the same image down to a thumbnail.
        $width = $image->width();
        $height = $image->height();

        $image->scaleDown(self::THUMBNAIL_WIDTH, self::THUMBNAIL_WIDTH);
        $disk->put($thumbnailPath, (string) $image->encode(new WebpEncoder(quality: 75, strip: true)));

        return Upload::create([
            'disk' => 'public',
            'path' => $path,
            'thumbnail_path' => $thumbnailPath,
            'folder' => $folder,
            'original_name' => Str::limit($file->getClientOriginalName(), 200, ''),
            'mime' => 'image/webp',
            'size' => $disk->size($path),
            'width' => $width,
            'height' => $height,
            'uploaded_by' => $userId,
        ]);
    }

    /**
     * True when the value is a path this application actually stored.
     * Used to reject arbitrary URLs in any image field.
     */
    public function isRegisteredPath(?string $path): bool
    {
        return filled($path) && Upload::where('path', $path)->exists();
    }
}
