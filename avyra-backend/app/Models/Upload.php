<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Upload extends Model
{
    use HasUuids;

    protected $fillable = [
        'disk', 'path', 'thumbnail_path', 'folder', 'original_name',
        'mime', 'size', 'width', 'height', 'uploaded_by',
    ];

    protected $appends = ['url', 'thumbnail_url'];

    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail_path
            ? Storage::disk($this->disk)->url($this->thumbnail_path)
            : null;
    }

    /**
     * Removes the stored files along with the row.
     */
    public function deleteWithFiles(): void
    {
        $disk = Storage::disk($this->disk);

        $disk->delete(array_filter([$this->path, $this->thumbnail_path]));

        $this->delete();
    }
}
