import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/classNames";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-hive-600 text-white hover:bg-hive-700 border-hive-600",
  secondary: "bg-white text-slate-900 hover:bg-slate-50 border-slate-200",
  danger: "bg-rose-600 text-white hover:bg-rose-700 border-rose-600",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export function Button({ variant = "primary", icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

