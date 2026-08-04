<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Upload;
use App\Services\UploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class UploadController extends Controller
{
    public function __construct(private readonly UploadService $uploads) {}

    public function index(Request $request): JsonResponse
    {
        $uploads = Upload::query()
            ->when($request->filled('folder'), fn ($q) => $q->where('folder', $request->string('folder')))
            ->latest('created_at')
            ->paginate($request->integer('per_page', 40));

        // The effective limit depends on the PHP host, so the client is told rather
        // than hard-coding a number that may be wrong.
        $uploads->additional(['meta' => ['max_bytes' => UploadService::maxBytes()]]);

        return response()->json($uploads);
    }

    /**
     * Accepts one or more images and returns their stored paths.
     * `mimes` is enforced rather than trusting the client's Content-Type.
     */
    public function store(Request $request): JsonResponse
    {
        // A request over post_max_size never reaches here — Laravel's ValidatePostSize
        // middleware rejects it with 413 first. What lands here is the per-file case,
        // where PHP invalidated the upload for exceeding upload_max_filesize.
        $maxKilobytes = (int) (UploadService::maxBytes() / 1024);

        $validated = $request->validate([
            'folder' => ['required', Rule::in(array_keys(UploadService::FOLDERS))],
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => [
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp,gif',
                'max:' . $maxKilobytes,
            ],
        ], [
            'files.*.max' => 'Each image must be ' . round($maxKilobytes / 1024, 1) . ' MB or smaller.',
            'files.*.mimes' => 'Only JPG, PNG, WEBP and GIF images are accepted.',
            'files.*.uploaded' => 'The file was larger than this server accepts ('
                . ini_get('upload_max_filesize') . '). Try a smaller image.',
        ]);

        $stored = [];

        foreach ($validated['files'] as $file) {
            try {
                $stored[] = $this->uploads->store($file, $validated['folder'], $request->user()->id);
            } catch (Throwable $e) {
                // One unreadable file should not discard the ones that worked.
                report($e);
            }
        }

        if ($stored === []) {
            return response()->json(['message' => 'None of the files could be processed.'], 422);
        }

        return response()->json(['data' => $stored], 201);
    }

    public function destroy(Upload $upload): JsonResponse
    {
        $upload->deleteWithFiles();

        return response()->json(['message' => 'Image deleted.']);
    }
}
