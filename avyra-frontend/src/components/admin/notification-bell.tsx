"use client";

import { Bell, CheckCheck, PackageCheck, ShoppingCart, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type AdminNotification,
} from "@/lib/admin";

/** How many fit in the panel before it sends you to the full list. */
const PANEL_LIMIT = 8;

const ICONS: Record<string, typeof Bell> = {
  order: ShoppingCart,
  courier: Truck,
  stock: PackageCheck,
};

/** "2 minutes ago" without pulling in a date library for one string. */
function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "এইমাত্র";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} মিনিট আগে`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} ঘণ্টা আগে`;

  return `${Math.floor(seconds / 86_400)} দিন আগে`;
}

/**
 * Topbar notifications: an unread badge, a panel of the most recent few, and a
 * toast when one arrives while the tab is open.
 *
 * The list is polled rather than pushed — there is no websocket in this stack —
 * so "new" means "not present the last time we looked".
 */
export function NotificationBell() {
  const router = useRouter();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Ids already accounted for. Null until the first response, which is what
  // stops the initial load announcing every unread notification at once.
  const seen = useRef<Set<string> | null>(null);

  const items = data?.data ?? [];
  const unread = data?.unread_count ?? 0;

  useEffect(() => {
    if (!data) return;

    const list = data.data ?? [];

    if (seen.current === null) {
      seen.current = new Set(list.map((n) => n.id));
      return;
    }

    const fresh = list.filter((n) => !seen.current!.has(n.id));
    list.forEach((n) => seen.current!.add(n.id));

    // Oldest first, so the newest ends up on top of the stack.
    [...fresh].reverse().forEach((n) => {
      toast(n.title, {
        description: n.message,
        action: n.link
          ? { label: "দেখুন", onClick: () => router.push(n.link as string) }
          : undefined,
      });
    });
  }, [data, router]);

  // Click outside and Escape both close the panel.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openNotification = (notification: AdminNotification) => {
    if (!notification.is_read) markRead.mutate(notification.id);
    setOpen(false);
    if (notification.link) router.push(notification.link);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications, ${unread} unread`}
        className="relative rounded-sm p-2 hover:bg-secondary"
      >
        <Bell className="h-[18px] w-[18px] text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-sm border border-border bg-card erp-shadow-md"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-card-foreground">
              Notifications
              {unread > 0 && <span className="ml-1 text-muted-foreground">({unread})</span>}
            </span>

            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-[22rem] divide-y divide-border overflow-y-auto">
              {items.slice(0, PANEL_LIMIT).map((notification) => {
                const Icon = ICONS[notification.type] ?? Bell;

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={twMerge(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary",
                        !notification.is_read && "bg-primary/5",
                      )}
                    >
                      <span
                        className={twMerge(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          notification.is_read
                            ? "bg-secondary text-muted-foreground"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-card-foreground">
                            {notification.title}
                          </span>
                          {!notification.is_read && (
                            <span
                              aria-hidden
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive"
                            />
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {timeAgo(notification.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-secondary"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
