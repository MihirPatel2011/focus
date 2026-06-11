import type { ReactNode } from "react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Minimal modal: blurred backdrop, pop-in panel, Escape/backdrop to close. */
export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-[3px] sm:items-start sm:p-4 sm:pt-[12vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="animate-pop w-full max-w-md rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-pop sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display mb-4 text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
