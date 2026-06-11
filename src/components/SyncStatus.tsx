import { useEffect, useRef, useState } from "react";
import { useDataStore } from "@/logic/stores/dataStore";
import { useOnline } from "@/logic/useOnline";

/**
 * Sync status indicator. Shows when you're offline (edits are cached locally
 * and will sync) or actively syncing pending writes, and briefly confirms once
 * everything is saved to the server. Stays out of the way when all is well.
 */
export function SyncStatus() {
  const online = useOnline();
  const pending = useDataStore((s) => s.pendingWrites);

  // Briefly show a "Synced" confirmation when pending writes clear while online.
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
    offline: { dot: "#d97706", text: "Offline — changes saved locally", pulse: false },
    syncing: { dot: "#2563eb", text: "Syncing…", pulse: true },
    synced: { dot: "#059669", text: "Synced", pulse: false },
  }[state];

  return (
    <div className="pointer-events-none fixed bottom-20 left-4 z-50 md:bottom-4">
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
        <span
          className={`inline-block h-2 w-2 rounded-full ${config.pulse ? "animate-pulse" : ""}`}
          style={{ backgroundColor: config.dot }}
        />
        {config.text}
      </div>
    </div>
  );
}
