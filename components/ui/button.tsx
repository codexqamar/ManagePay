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
  sm: "px-4 py-1 text-sm", // button-sm
  md: "px-6 py-2 text-base", // button-md
  lg: "px-8 py-3 text-lg", 
  icon: "h-10 w-10 p-0",
};

const VARIANT_CLASSES: Record<Variant, string> = {
  // Stripi: pill-shaped buttons
  default: "bg-primary text-white hover:bg-primary-soft rounded-full font-medium transition-all duration-200",
  outline: "border border-primary text-primary bg-canvas hover:bg-canvas-soft rounded-full font-medium transition-all duration-200",
  ghost: "bg-transparent hover:bg-canvas-soft text-ink-secondary rounded-full transition-all duration-200",
  destructive: "bg-ruby text-white hover:bg-ruby/90 rounded-full font-medium transition-all duration-200",
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none";

  const classes = cn(base, SIZE_CLASSES[size], VARIANT_CLASSES[variant], className);

  return <button className={classes} {...props} />;
}
