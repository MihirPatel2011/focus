import { Modal } from "@/components/ui/Modal";
import { SHORTCUTS } from "@/logic/useGlobalShortcuts";

/** Lists the global keyboard shortcuts (opened with "?"). */
export function ShortcutsHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts">
      <ul className="flex flex-col gap-2">
        {SHORTCUTS.map((s, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted">{s.label}</span>
            <span className="flex items-center gap-1">
              {s.keys.map((k, j) =>
                k === "then" ? (
                  <span key={j} className="text-xs text-muted">
                    then
                  </span>
                ) : (
                  <kbd key={j} className="kbd">
                    {k}
                  </kbd>
                ),
              )}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
