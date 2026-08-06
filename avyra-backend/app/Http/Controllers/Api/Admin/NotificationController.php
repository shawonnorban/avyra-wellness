<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::query()
            ->when($request->boolean('unread'), fn ($q) => $q->unread())
            ->latest('created_at')
            ->paginate($request->integer('per_page', 25));

        // `toArray()` first: `paginate()` returns a paginator object, and `+` on an
        // object is a TypeError rather than a merge — this endpoint used to 500.
        return response()->json(
            $notifications->toArray() + ['unread_count' => Notification::unread()->count()],
        );
    }

    public function markRead(Notification $notification): JsonResponse
    {
        $notification->update(['is_read' => true]);

        return response()->json(['data' => $notification]);
    }

    public function markAllRead(): JsonResponse
    {
        Notification::unread()->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function destroy(Notification $notification): JsonResponse
    {
        $notification->delete();

        return response()->json(['message' => 'Notification deleted.']);
    }
}
