"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login screen is the one admin route that must render without a session.
  const isLogin = usePathname() === "/admin/login";

  if (isLogin) return <>{children}</>;

  return <AdminShell>{children}</AdminShell>;
}
