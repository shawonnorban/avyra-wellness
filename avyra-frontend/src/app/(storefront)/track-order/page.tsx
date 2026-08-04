"use client";

import Link from "next/link";
import { CheckCircle, Clock, Package, Search, ShoppingBag, Truck } from "lucide-react";
import { useState } from "react";
import { toApiError } from "@/lib/api";
import { formatTaka } from "@/lib/format";
import { useTrackOrder } from "@/lib/queries";

const STATUS_STEPS = [
  { label: "Order Received", icon: Clock },
  { label: "Confirmed", icon: CheckCircle },
  { label: "Processing", icon: Package },
  { label: "Shipped", icon: Truck },
  { label: "Delivered", icon: CheckCircle },
];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const track = useTrackOrder();
  const order = track.data;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await track.mutateAsync({ order_number: orderNumber.trim(), phone: phone.trim() });
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  // The API returns a 5-step timeline; the last completed step is the current one.
  const reached = order ? order.timeline.steps.filter((s) => s.done).length - 1 : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-lg font-bold text-foreground">Track Your Order</h1>

      <form onSubmit={submit} className="bg-card rounded-xl border border-border p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter your order number and the phone number you ordered with
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            placeholder="e.g. AVY-20260728-0001"
            aria-label="Order number"
            className="h-10 rounded-sm border border-input bg-background px-3 text-sm focus:outline-2 focus:outline-ring/40"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="01XXXXXXXXX"
            aria-label="Phone number"
            className="h-10 rounded-sm border border-input bg-background px-3 text-sm focus:outline-2 focus:outline-ring/40"
          />
        </div>

        <button
          type="submit"
          disabled={track.isPending}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <Search className="w-4 h-4" /> Search
        </button>
      </form>

      {error && (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {order && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-card-foreground">Order #{order.order_number}</h2>
              <span className="text-xs text-muted-foreground">{order.order_date}</span>
            </div>

            {order.timeline.cancelled ? (
              <p className="rounded-sm bg-destructive/10 px-4 py-3 text-sm text-destructive">
                This order was {order.status.toLowerCase()}. Contact us if that looks wrong.
              </p>
            ) : (
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
                <div
                  className="absolute top-4 left-0 h-0.5 bg-primary transition-all"
                  style={{ width: `${(Math.max(0, reached) / (STATUS_STEPS.length - 1)) * 100}%` }}
                />

                {STATUS_STEPS.map((step, i) => {
                  const active = i <= reached;
                  const current = i === reached;

                  return (
                    <div key={step.label} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        } ${current ? "ring-4 ring-primary/20" : ""}`}
                      >
                        <step.icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 text-center ${
                          active ? "text-primary font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <h3 className="text-sm font-semibold text-card-foreground">Products</h3>

            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    x{item.quantity} @ {formatTaka(item.unit_price)}
                    {item.variant_label && ` · ${item.variant_label}`}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  {formatTaka(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}

            <div className="flex justify-between pt-2 font-bold">
              <span>Total</span>
              <span className="text-primary">{formatTaka(order.total)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ShoppingBag className="w-4 h-4" /> Back to Shop
        </Link>
      </div>
    </div>
  );
}
