import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "subtle";

const styles: Record<Variant, string> = {
  primary:
    "bg-ink text-canvas shadow-soft hover:-translate-y-px hover:shadow-lift",
  ghost: "bg-transparent text-soft hover:bg-ink/5 hover:text-ink",
  subtle: "bg-ink/[0.06] text-ink hover:bg-ink/10",
  danger: "bg-[#b3361b] text-white shadow-soft hover:bg-[#9d2f17]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  return (
    <button
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}
