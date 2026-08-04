import { twMerge } from "tailwind-merge";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge("rounded-xl border border-border bg-card p-5 erp-shadow", className)}
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-secondary text-secondary-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
  } as const;

  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={twMerge(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Maps an order/courier status onto a badge tone. */
export function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    // Order statuses are lower-case; courier statuses stay title-case, and both
    // reach this function.
    case "delivered":
    case "Delivered":
      return "success";
    case "cancel":
    case "Cancelled":
    case "Returned":
      return "danger";
    case "hold":
    case "fake":
      return "warning";
    case "Picked":
    case "In Transit":
      return "info";
    default:
      return "neutral";
  }
}
