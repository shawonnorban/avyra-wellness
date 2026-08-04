import { twMerge } from "tailwind-merge";

/**
 * Form primitives styled from the shared token set (shadcn-equivalent), so the
 * storefront and the admin share one control language.
 */
const controlBase =
  "w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:border-ring focus:outline-2 focus:outline-offset-0 focus:outline-ring/30 " +
  "disabled:opacity-50";

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({
  className,
  invalid,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={twMerge(controlBase, "h-10", invalid && "border-destructive", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={twMerge(controlBase, "min-h-20 resize-y", invalid && "border-destructive", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={twMerge(
        controlBase,
        "h-10 appearance-none pr-9",
        invalid && "border-destructive",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
