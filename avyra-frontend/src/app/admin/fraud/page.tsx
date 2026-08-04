"use client";

import { Loader2, Plus, ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/misc";
import { toApiError } from "@/lib/api";
import {
  useBlockItem,
  useBlockedOrders,
  useBlocklist,
  useFraudSettings,
  useFraudStats,
  useMe,
  useSaveFraudSettings,
  useUnblockItem,
  type FraudSettings,
} from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

const TABS = ["Settings", "Blocked attempts", "Blocklist"] as const;

const BLOCK_WINDOWS = [
  { value: 0, label: "Off" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 360, label: "6 hours" },
  { value: 1440, label: "24 hours" },
];

export default function AdminFraudPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Settings");
  const { data: stats } = useFraudStats();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Fraud Detection</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Automatic screening of every checkout before an order is created.
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Blocked today" value={stats.blocked_today} />
          <StatTile label="Blocked total" value={stats.blocked_total} />
          <StatTile label="Flagged" value={stats.flagged_total} />
          <StatTile label="High-risk customers" value={stats.high_risk_customers} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            aria-pressed={tab === item}
            className={twMerge(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              tab === item
                ? "border-primary bg-primary text-white"
                : "border-input bg-white text-foreground hover:border-input",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Settings" && <SettingsTab />}
      {tab === "Blocked attempts" && <BlockedAttemptsTab />}
      {tab === "Blocklist" && <BlocklistTab />}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </Card>
  );
}

function SettingsTab() {
  const { data, isLoading } = useFraudSettings();

  // The form is only mounted once the config exists, so it can seed useState
  // directly instead of syncing from an effect.
  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return <SettingsForm initial={data} />;
}

function SettingsForm({ initial }: { initial: FraudSettings }) {
  const save = useSaveFraudSettings();
  const { data: me } = useMe();
  const canEdit = me?.permissions.fraud?.edit ?? false;

  const [form, setForm] = useState<FraudSettings>(initial);

  const set = <K extends keyof FraudSettings>(key: K, value: FraudSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await save.mutateAsync(form);
      toast.success("Fraud settings saved");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
            disabled={!canEdit}
            className="mt-0.5 h-5 w-5 rounded border-input accent-primary"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">Protection active</span>
            <span className="block text-sm text-muted-foreground">
              When off, no checks run at all and every order is accepted.
            </span>
          </span>
        </label>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-foreground">Repeat-order windows</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A second attempt inside the window is refused. Each of these blocks on its own.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Same phone number">
            <Select
              value={form.phone_block_minutes}
              onChange={(e) => set("phone_block_minutes", Number(e.target.value))}
              disabled={!canEdit}
            >
              {BLOCK_WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Same IP address">
            <Select
              value={form.ip_block_minutes}
              onChange={(e) => set("ip_block_minutes", Number(e.target.value))}
              disabled={!canEdit}
            >
              {BLOCK_WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </Select>
          </Field>
        </div>

        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.device_fingerprinting}
            onChange={(e) => set("device_fingerprinting", e.target.checked)}
            disabled={!canEdit}
            className="mt-0.5 h-5 w-5 rounded border-input accent-primary"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">Device fingerprinting</span>
            <span className="block text-sm text-muted-foreground">
              Catches repeat orders from the same browser even when the IP changes via VPN.
            </span>
          </span>
        </label>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-foreground">Data quality &amp; history</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Minimum phone digits">
            <Input
              type="number"
              value={form.min_phone_digits}
              onChange={(e) => set("min_phone_digits", Number(e.target.value))}
              disabled={!canEdit}
              min={0}
              max={20}
            />
          </Field>

          <Field label="Minimum address length">
            <Input
              type="number"
              value={form.min_address_length}
              onChange={(e) => set("min_address_length", Number(e.target.value))}
              disabled={!canEdit}
              min={0}
            />
          </Field>

          <Field
            label="Delivery success threshold (%)"
            hint="Flag buyers below this rate, once they have 3+ settled orders."
          >
            <Input
              type="number"
              value={form.delivery_success_threshold}
              onChange={(e) => set("delivery_success_threshold", Number(e.target.value))}
              disabled={!canEdit}
              min={0}
              max={100}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <Field
          label="Message shown to a blocked customer"
          hint="Displayed on the checkout page, alongside your WhatsApp number."
        >
          <Textarea
            value={form.block_message}
            onChange={(e) => set("block_message", e.target.value)}
            disabled={!canEdit}
            className="bn"
          />
        </Field>
      </Card>

      {canEdit && (
        <Button type="submit" size="lg" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save settings"}
        </Button>
      )}
    </form>
  );
}

function BlockedAttemptsTab() {
  const { data, isLoading } = useBlockedOrders();
  const rows = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing blocked yet"
        description="Refused and flagged checkout attempts will appear here."
      />
    );
  }

  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-3 pl-4 pr-4 font-medium">When</th>
              <th className="py-3 pr-4 font-medium">Phone</th>
              <th className="py-3 pr-4 font-medium">IP</th>
              <th className="py-3 pr-4 font-medium">Score</th>
              <th className="py-3 pr-4 font-medium">Signals</th>
              <th className="py-3 pr-4 font-medium">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-3 pl-4 pr-4 text-xs text-muted-foreground">
                  {formatDateTime(row.created_at)}
                </td>
                <td className="py-3 pr-4 text-foreground">{row.phone ?? "—"}</td>
                <td className="py-3 pr-4 text-muted-foreground">{row.ip_address ?? "—"}</td>
                <td className="py-3 pr-4">
                  <Badge
                    tone={
                      row.risk_level === "Critical" || row.risk_level === "High"
                        ? "danger"
                        : row.risk_level === "Medium"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {row.risk_score} · {row.risk_level}
                  </Badge>
                </td>
                <td className="py-3 pr-4">
                  <ul className="space-y-0.5">
                    {(row.signals ?? []).map((signal) => (
                      <li key={signal.code} className="text-xs text-muted-foreground">
                        {signal.label}{" "}
                        <span className="text-muted-foreground">(+{signal.score})</span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={row.action_taken === "blocked" ? "danger" : "warning"}>
                    {row.action_taken}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BlocklistTab() {
  const { data, isLoading } = useBlocklist();
  const block = useBlockItem();
  const unblock = useUnblockItem();
  const { data: me } = useMe();

  const canCreate = me?.permissions.fraud?.create ?? false;
  const canDelete = me?.permissions.fraud?.delete ?? false;

  const [type, setType] = useState<"phone" | "ip" | "device">("phone");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await block.mutateAsync({ type, value: value.trim(), reason: reason || undefined });
      setValue("");
      setReason("");
      toast.success("Added to the blocklist");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const remove = async (entryType: "phone" | "ip" | "device", id: string) => {
    try {
      await unblock.mutateAsync({ type: entryType, id });
      toast.success("Unblocked");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-primary" />
      </div>
    );
  }

  const groups = [
    { key: "phone" as const, title: "Phone numbers", rows: data?.phones ?? [], field: "phone" as const },
    { key: "ip" as const, title: "IP addresses", rows: data?.ips ?? [], field: "ip_address" as const },
    { key: "device" as const, title: "Devices", rows: data?.devices ?? [], field: "device_fingerprint" as const },
  ];

  return (
    <div className="space-y-5">
      {canCreate && (
        <Card>
          <h2 className="text-base font-semibold text-foreground">Add a manual block</h2>

          <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr_1fr_auto]">
            <Select value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Block type">
              <option value="phone">Phone</option>
              <option value="ip">IP</option>
              <option value="device">Device</option>
            </Select>

            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              placeholder={type === "phone" ? "01XXXXXXXXX" : type === "ip" ? "203.0.113.4" : "fp_xxxxx"}
              aria-label="Value to block"
            />

            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              aria-label="Reason"
            />

            <Button type="submit" disabled={block.isPending}>
              {block.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Block</>}
            </Button>
          </form>
        </Card>
      )}

      {groups.map((group) => (
        <Card key={group.key} className="p-0">
          <h2 className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
            {group.title}
            <span className="ml-2 text-muted-foreground">{group.rows.length}</span>
          </h2>

          {group.rows.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Nothing blocked.</p>
          ) : (
            <ul className="divide-y divide-border">
              {group.rows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{row[group.field]}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.reason ?? "No reason given"} · {formatDateTime(row.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={row.is_active ? "danger" : "neutral"}>
                      {row.is_active ? "Blocked" : "Inactive"}
                    </Badge>
                    {canDelete && row.is_active && (
                      <Button size="sm" variant="outline" onClick={() => remove(group.key, row.id)}>
                        <ShieldOff className="h-3.5 w-3.5" /> Unblock
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
