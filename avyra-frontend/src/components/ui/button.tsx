import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

/**
 * Matches the previous build's button language: 0.25rem radius, teal primary,
 * subtle outline and ghost variants.
 */
const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        accent: "bg-avyra-coral text-white hover:brightness-105",
        outline: "border border-input bg-background text-foreground hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        subtle: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonVariants = VariantProps<typeof button>;

export function Button({
  className,
  variant,
  size,
  block,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants) {
  return <button className={twMerge(button({ variant, size, block }), className)} {...props} />;
}

export function ButtonLink({
  className,
  variant,
  size,
  block,
  ...props
}: React.ComponentProps<typeof Link> & ButtonVariants) {
  return <Link className={twMerge(button({ variant, size, block }), className)} {...props} />;
}

export { button as buttonStyles };
