import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createTask } from "@/data/tasks";
import { useUid } from "@/logic/useCurrentUser";

/**
 * Frictionless capture: only a title is required. The task lands in the inbox
 * (status "inbox") to be clarified later. Stays open for rapid entry.
 */
export function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uid = useUid();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  async function submit(closeAfter: boolean) {
    const value = title.trim();
    if (!value || !uid) return;
    setSaving(true);
    try {
      await createTask(uid, { title: value });
      setTitle("");
      if (closeAfter) onClose();
      else inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Quick add to inbox">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(true);
        }}
      >
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            // Shift+Enter keeps the dialog open for the next capture.
            if (e.key === "Enter" && e.shiftKey) {
              e.preventDefault();
              submit(false);
            }
          }}
          placeholder="What's on your mind?"
          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted">
            Enter to save · Shift+Enter to add another
          </span>
          <Button type="submit" disabled={saving || !title.trim()}>
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
}
