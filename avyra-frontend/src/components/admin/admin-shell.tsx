"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Receipt,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UserCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { Spinner } from "@/components/ui/misc";
import { NotificationBell } from "@/components/admin/notification-bell";
import { useLogout, useMe } from "@/lib/admin";
import type { AdminUser } from "@/lib/types";
import { useStoredValue } from "@/lib/use-stored-value";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  /** Module key in the permission matrix; omitted items are always visible. */
  module?: string;
  external?: boolean;
};

/** One flat list, in sidebar order. */
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", module: "dashboard" },
  { label: "Shop", icon: ShoppingBag, path: "/shop", external: true },
  { label: "Order", icon: ShoppingCart, path: "/admin/orders", module: "sales" },
  { label: "Customers", icon: UserCircle, path: "/admin/customers", module: "customers" },
  { label: "Courier", icon: Truck, path: "/admin/courier", module: "courier" },
  { label: "Purchase", icon: Receipt, path: "/admin/purchase", module: "purchase" },
  { label: "Inventory", icon: Package, path: "/admin/products", module: "inventory" },
  { label: "Marketing", icon: Megaphone, path: "/admin/landing-pages", module: "marketing" },
  { label: "Fraud Detection", icon: ShieldAlert, path: "/admin/fraud", module: "fraud" },
  { label: "Settings", icon: Settings, path: "/admin/settings", module: "settings" },
];

const COLLAPSE_KEY = "avyra_sidebar_collapsed";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError } = useMe();

  const [mobileOpen, setMobileOpen] = useState(false);

  // Read through useSyncExternalStore so the server render and hydration agree
  // without an extra render pass after mount.
  const [storedCollapsed, storeCollapsed] = useStoredValue(COLLAPSE_KEY, "0");
  const collapsed = storedCollapsed === "1";

  const toggleCollapsed = () => storeCollapsed(collapsed ? "0" : "1");

  // An unauthenticated /auth/me is a 401, which lands here as an error.
  useEffect(() => {
    if (isError) router.replace("/admin/login");
  }, [isError, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        user={user}
        pathname={pathname}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={twMerge("transition-all duration-300", collapsed ? "lg:ml-[68px]" : "lg:ml-[240px]")}>
        <AdminTopBar user={user} onOpenMobile={() => setMobileOpen(true)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function AdminSidebar({
  user,
  pathname,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  user: AdminUser;
  pathname: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const isActive = (item: NavItem) =>
    item.path === "/admin" ? pathname === "/admin" : pathname.startsWith(item.path);

  const items = NAV_ITEMS.filter((item) => !item.module || user.permissions[item.module]?.view);

  const showLabels = !collapsed;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={twMerge(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-sidebar-border">
          {showLabels && (
            <Link href="/admin" className="font-semibold tracking-[0.2em] text-white">
              AVYRA
            </Link>
          )}

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-sm p-2 hover:bg-sidebar-hover lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden rounded-sm p-2 hover:bg-sidebar-hover lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {items.map((item) => {
            const active = isActive(item);

            const className = twMerge(
              "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-sidebar-active font-medium text-sidebar-active-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white",
            );

            const content = (
              <>
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {showLabels && <span className="truncate">{item.label}</span>}
              </>
            );

            return item.external ? (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noreferrer noopener"
                className={className}
                title={collapsed ? item.label : undefined}
              >
                {content}
              </a>
            ) : (
              <Link
                key={item.path}
                href={item.path}
                onClick={onCloseMobile}
                className={className}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function AdminTopBar({ user, onOpenMobile }: { user: AdminUser; onOpenMobile: () => void }) {
  const router = useRouter();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials =
    user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AV";

  const signOut = async () => {
    await logout.mutateAsync().catch(() => undefined);
    toast.success("Logged out");
    router.replace("/admin/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 erp-shadow">
      <div className="flex items-center gap-3 flex-1">
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-sm p-2 hover:bg-secondary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="relative hidden max-w-sm flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search orders, customers, products…"
            aria-label="Search"
            className="h-9 w-full rounded-sm border border-input bg-background pl-9 pr-3 text-sm focus:outline-2 focus:outline-ring/30"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const value = (e.target as HTMLInputElement).value.trim();
              if (value) router.push(`/admin/orders?search=${encodeURIComponent(value)}`);
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <NotificationBell />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-card-foreground">{user.name}</span>
              <span className="block text-xs capitalize text-muted-foreground">{user.role}</span>
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-sm border border-border bg-popover p-1 shadow-lg"
            >
              <p className="px-3 py-2 text-xs text-muted-foreground">{user.email}</p>
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
