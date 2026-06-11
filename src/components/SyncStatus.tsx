import { useEffect, useRef, useState } from "react";
import { useDataStore } from "@/logic/stores/dataStore";
import { useOnline } from "@/logic/useOnline";

/**
 * Sync status indicator. Shows when offline (edits cached locally) or actively
 * syncing, and briefly confirms once saved. Invisible when all is well.
 */
export function SyncStatus() {
  const online = useOnline();
  const pending = useDataStore((s) => s.pendingWrites);

  const [justSynced, setJustSynced] = useState(false);
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && online) {
      setJustSynced(true);
      const t = setTimeout(() => setJustSynced(false), 2000);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending, online]);

  let state: "offline" | "syncing" | "synced" | null = null;
  if (!online) state = "offline";
  else if (pending) state = "syncing";
  else if (justSynced) state = "synced";

  if (!state) return null;

  const config = {
    offline: {
      dot: "#b07d2e",
      text: "Offline — changes saved locally",
      pulse: false,
    },
    syncing: { dot: "#c2410c", text: "Syncing…", pulse: true },
    synced: { dot: "#7d8a4e", text: "Synced", pulse: false },
  }[state];

  return (
    <div className="pointer-events-none fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 z-40 md:bottom-5">
      <div className="animate-pop flex items-center gap-2 rounded-full bg-surface/95 px-3.5 py-1.5 text-xs font-medium text-soft shadow-soft ring-1 ring-ink/5 backdrop-blur">
        <span
          className={`inline-block h-2 w-2 rounded-full ${config.pulse ? "animate-breathe" : ""}`}
          style={{ backgroundColor: config.dot }}
        />
        {config.text}
      </div>
    </div>
  );
}
