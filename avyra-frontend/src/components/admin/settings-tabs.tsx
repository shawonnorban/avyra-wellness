"use client";

import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { ImageUpload } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/misc";
import { toApiError } from "@/lib/api";
import {
  useBanners,
  useDeactivateStaffUser,
  useDeleteBanner,
  usePermissionMatrix,
  useSaveBanner,
  useSavePermission,
  useSaveStaffUser,
  useStaffUsers,
  type Banner,
  type StaffUser,
} from "@/lib/admin";
import { formatDate, productImageUrl } from "@/lib/format";

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
    >
      <button type="button" className="fixed inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <Card className="relative my-12 w-full max-w-md">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <div className="mt-4">{children}</div>
      </Card>
    </div>
  );
}

/* ---------- Shop banners ---------- */

export function BannersTab() {
  const { data: banners, isLoading } = useBanners();
  const save = useSaveBanner();
  const remove = useDeleteBanner();
  const [editing, setEditing] = useState<Banner | "new" | null>(null);

  const confirmDelete = async (banner: Banner) => {
    if (!window.confirm(`Delete “${banner.title ?? "this banner"}”?`)) return;

    try {
      await remove.mutateAsync(banner.id);
      toast.success("Banner deleted");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Shown as a slider at the top of the shop page, ordered by sort order.
        </p>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> New banner
        </Button>
      </div>

      {(banners ?? []).length === 0 ? (
        <EmptyState title="No banners" description="Upload one to show a hero slider on the shop." />
      ) : (
        <div className="space-y-3">
          {(banners ?? []).map((banner) => (
            <Card key={banner.id} className="flex flex-wrap items-center gap-4">
              <div className="h-16 w-28 shrink-0 overflow-hidden rounded-sm bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={productImageUrl(banner.image_path)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{banner.title ?? "Untitled"}</p>
                {banner.subtitle && (
                  <p className="truncate text-sm text-muted-foreground">{banner.subtitle}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Order {banner.sort_order}
                  {banner.link_url && ` · links to ${banner.link_url}`}
                </p>
              </div>

              <Badge tone={banner.is_active ? "success" : "neutral"}>
                {banner.is_active ? "Live" : "Hidden"}
              </Badge>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(banner)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => confirmDelete(banner)}
                  aria-label="Delete banner"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <BannerDialog
          banner={editing === "new" ? null : editing}
          saving={save.isPending}
          onSave={async (payload) => {
            try {
              await save.mutateAsync({ id: editing === "new" ? undefined : editing.id, payload });
              toast.success("Banner saved");
              setEditing(null);
            } catch (error) {
              toast.error(toApiError(error).message);
            }
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function BannerDialog({
  banner,
  saving,
  onSave,
  onClose,
}: {
  banner: Banner | null;
  saving: boolean;
  onSave: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    image_path: banner?.image_path ?? null,
    link_url: banner?.link_url ?? "",
    button_text: banner?.button_text ?? "Shop Now",
    sort_order: String(banner?.sort_order ?? 0),
    is_active: banner?.is_active ?? true,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.image_path) {
      toast.error("Upload a banner image first.");
      return;
    }

    onSave({
      title: form.title || null,
      subtitle: form.subtitle || null,
      image_path: form.image_path,
      link_url: form.link_url || null,
      button_text: form.button_text || null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    });
  };

  return (
    <Dialog title={banner ? "Edit banner" : "New banner"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ImageUpload
          label="Banner image"
          value={form.image_path}
          onChange={(path) => setForm({ ...form, image_path: path })}
          folder="banners"
          hint="Wide image — around 2000×700 works best."
        />

        <Field label="Title">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>

        <Field label="Subtitle">
          <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Link" hint="e.g. /vital-plus">
            <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          Show on the shop
        </label>

        <div className="flex gap-2">
          <Button type="submit" block disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
          <Button type="button" variant="subtle" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Dialog>
  );
}

/* ---------- Staff users ---------- */

export function StaffTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useStaffUsers(search);
  const save = useSaveStaffUser();
  const deactivate = useDeactivateStaffUser();
  const [editing, setEditing] = useState<StaffUser | "new" | null>(null);

  const users = data?.data ?? [];

  const confirmDeactivate = async (user: StaffUser) => {
    if (!window.confirm(`Deactivate ${user.name}? They will no longer be able to sign in.`)) return;

    try {
      await deactivate.mutateAsync(user.id);
      toast.success("User deactivated");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          type="search"
          placeholder="Search staff"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search staff"
          className="max-w-xs"
        />
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> New staff account
        </Button>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No staff accounts" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-3 pl-4 pr-4 font-medium">Name</th>
                <th className="py-3 pr-4 font-medium">Email</th>
                <th className="py-3 pr-4 font-medium">Role</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Added</th>
                <th className="py-3 pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50">
                  <td className="py-3 pl-4 pr-4">
                    <span className="flex items-center gap-2">
                      {user.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
                          {user.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium text-foreground">{user.name}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={user.role === "admin" ? "info" : "neutral"} className="capitalize">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={user.is_active ? "success" : "danger"}>
                      {user.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{formatDate(user.created_at)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(user)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {user.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDeactivate(user)}
                          aria-label={`Deactivate ${user.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {editing && (
        <StaffDialog
          user={editing === "new" ? null : editing}
          saving={save.isPending}
          onSave={async (payload) => {
            try {
              await save.mutateAsync({ id: editing === "new" ? undefined : editing.id, payload });
              toast.success("Staff account saved");
              setEditing(null);
            } catch (error) {
              toast.error(toApiError(error).message);
            }
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function StaffDialog({
  user,
  saving,
  onSave,
  onClose,
}: {
  user: StaffUser | null;
  saving: boolean;
  onSave: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    password: "",
    role: user?.role ?? "employee",
    avatar_path: user?.avatar_path ?? null,
    is_active: user?.is_active ?? true,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      role: form.role,
      avatar_path: form.avatar_path,
      is_active: form.is_active,
    };

    // Only send a password when one was actually typed, so editing a user
    // does not require re-entering it.
    if (form.password) payload.password = form.password;

    onSave(payload);
  };

  return (
    <Dialog title={user ? "Edit staff account" : "New staff account"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ImageUpload
          label="Avatar"
          value={form.avatar_path}
          onChange={(path) => setForm({ ...form, avatar_path: path })}
          folder="avatars"
        />

        <Field label="Full name" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>

        <Field label="Email" required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="off"
          />
        </Field>

        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>

        <Field
          label={user ? "New password" : "Password"}
          required={!user}
          hint={user ? "Leave blank to keep the current password." : "At least 8 characters."}
        >
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!user}
            autoComplete="new-password"
          />
        </Field>

        <Field label="Role" required>
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as StaffUser["role"] })}
          >
            <option value="user">User — no admin access</option>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin — full access</option>
          </Select>
        </Field>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          Can sign in
        </label>

        <div className="flex gap-2">
          <Button type="submit" block disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
          <Button type="button" variant="subtle" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Dialog>
  );
}

/* ---------- Permission matrix ---------- */

const ABILITIES = ["view", "create", "edit", "delete", "approve"] as const;

export function PermissionsTab() {
  const { data, isLoading } = usePermissionMatrix();
  const save = useSavePermission();
  const [role, setRole] = useState("manager");

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="text-primary" />
      </div>
    );
  }

  const isAdmin = role === "admin";

  const toggle = async (module: string, ability: (typeof ABILITIES)[number], next: boolean) => {
    const current = data.matrix[role][module];

    try {
      await save.mutateAsync({
        role,
        module,
        can_view: ability === "view" ? next : current.view,
        can_create: ability === "create" ? next : current.create,
        can_edit: ability === "edit" ? next : current.edit,
        can_delete: ability === "delete" ? next : current.delete,
        can_approve: ability === "approve" ? next : current.approve,
      });
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {data.roles.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            aria-pressed={role === r}
            className={twMerge(
              "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
              role === r
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-foreground hover:bg-secondary",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {isAdmin && (
        <p className="rounded-sm bg-info/10 px-4 py-3 text-sm text-foreground">
          Admins bypass the matrix in code and always have full access, so there is nothing to edit here.
        </p>
      )}

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-3 pl-4 pr-4 font-medium">Module</th>
              {ABILITIES.map((ability) => (
                <th key={ability} className="py-3 pr-4 text-center font-medium capitalize">
                  {ability}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.modules.map((module) => (
              <tr key={module}>
                <td className="py-3 pl-4 pr-4 font-medium capitalize text-foreground">
                  {module.replace(/_/g, " ")}
                </td>

                {ABILITIES.map((ability) => {
                  const allowed = data.matrix[role]?.[module]?.[ability] ?? false;

                  return (
                    <td key={ability} className="py-3 pr-4 text-center">
                      <button
                        type="button"
                        disabled={isAdmin || save.isPending}
                        onClick={() => toggle(module, ability, !allowed)}
                        aria-label={`${allowed ? "Revoke" : "Grant"} ${ability} on ${module} for ${role}`}
                        aria-pressed={allowed}
                        className={twMerge(
                          "inline-flex h-6 w-6 items-center justify-center rounded-sm border transition-colors disabled:opacity-50",
                          allowed
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input text-muted-foreground hover:border-input",
                        )}
                      >
                        {allowed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
