"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import api, { toApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/misc";
import { useNotifications } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useNotifications();

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.post("/admin/notifications/read-all");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
  });

  const notifications = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data?.unread_count ?? 0} unread</p>
        </div>

        {(data?.unread_count ?? 0) > 0 && (
          <Button
            variant="outline"
            onClick={() =>
              markAllRead.mutateAsync().catch((e) => toast.error(toApiError(e).message))
            }
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState title="Nothing here yet" description="New orders and courier updates show up here." />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={twMerge("px-5 py-4", !notification.is_read && "bg-primary/5/50")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{notification.title}</p>
                      <Badge tone={notification.type === "courier" ? "info" : "neutral"}>
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {notification.link && (
                      <Link href={notification.link}>
                        <Button size="sm" variant="outline">Open</Button>
                      </Link>
                    )}
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markRead.mutate(notification.id)}
                        aria-label="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
