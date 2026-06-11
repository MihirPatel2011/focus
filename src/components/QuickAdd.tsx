import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createTask } from "@/data/tasks";
import { useUid } from "@/logic/useCurrentUser";

/**
 * Frictionless capture: only a title is required. The task lands in the inbox
 * to be clarified later. Shift+Enter keeps it open for rapid entry.
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
    <Modal open={open} onClose={onClose} title="Capture">
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
            if (e.key === "Enter" && e.shiftKey) {
              e.preventDefault();
              submit(false);
            }
          }}
          placeholder="What's on your mind?"
          className="w-full border-0 bg-transparent text-lg text-ink outline-none placeholder:text-muted"
        />
        <div className="mt-5 flex items-center justify-between border-t border-line/70 pt-4">
          <span className="hidden text-xs text-muted sm:block">
            <span className="kbd">↵</span> save ·{" "}
            <span className="kbd">⇧↵</span> save & add another
          </span>
          <Button
            type="submit"
            disabled={saving || !title.trim()}
            className="ml-auto"
          >
            Add to inbox
          </Button>
        </div>
      </form>
    </Modal>
  );
}
