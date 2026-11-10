import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/classNames";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "border-ink bg-ink text-honey-500 hover:bg-black",
  secondary: "border-ink/20 bg-white text-ink hover:border-ink/50",
  danger: "border-status-risco-texto bg-status-risco-texto text-white hover:brightness-110",
  ghost: "border-transparent bg-transparent text-ink/70 hover:bg-ink/5 hover:text-ink",
};

export function botao(variant: Variant = "primary", className?: string) {
  return cn(
    "press focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export function Button({ variant = "primary", icon, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={botao(variant, className)} {...props}>
      {icon}
      {children}
    </button>
  );
}
