import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "subtle";

const styles: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-slate-700",
  ghost: "bg-transparent text-ink hover:bg-line/60",
  subtle: "bg-line/50 text-ink hover:bg-line",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}
