// components/ui/button.tsx
import * as React from "react";

type Variant = "default" | "outline" | "ghost" | "destructive";
export type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

/**
 * Lightweight classnames joiner to avoid dependency on an external `cn` util.
 */
function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  icon: "h-10 w-10 p-0",
};

const VARIANT_CLASSES: Record<Variant, string> = {
  // These rely on your CSS tokens (globals.css) e.g. --primary, --primary-foreground, etc.
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";

  const classes = cn(base, SIZE_CLASSES[size], VARIANT_CLASSES[variant], className);

  return <button className={classes} {...props} />;
}
