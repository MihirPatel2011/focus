import { useDataStore, selectArea } from "@/logic/stores/dataStore";
import { useTimerStore } from "@/logic/stores/timerStore";
import { useTicker } from "@/logic/useTicker";
import { formatDuration } from "@/lib/dates";

/**
 * Floating pill shown when a focus session is running but the distraction-free
 * overlay is minimized. Keeps the elapsed time visible and reopens focus mode.
 */
export function FocusPill() {
  const status = useTimerStore((s) => s.status);
  const minimized = useTimerStore((s) => s.minimized);
  const areaId = useTimerStore((s) => s.areaId);
  const elapsedSeconds = useTimerStore((s) => s.elapsedSeconds);
  const setMinimized = useTimerStore((s) => s.setMinimized);
  const areas = useDataStore((s) => s.areas);

  const now = useTicker(status === "running");

  if (status === "idle" || !minimized) return null;

  const area = selectArea(areas, areaId);
  const accent = area?.color ?? "#c2410c";

  return (
    <button
      onClick={() => setMinimized(false)}
      className="animate-pop fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 z-50 flex items-center gap-2.5 rounded-full bg-ink py-2 pl-3.5 pr-4 text-sm font-medium text-canvas shadow-lift transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 md:bottom-6 md:left-auto md:right-6"
      title="Return to focus mode"
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          status === "running" ? "animate-breathe" : ""
        }`}
        style={{ backgroundColor: accent }}
      />
      <span className="font-mono tabular-nums">
        {formatDuration(elapsedSeconds(now))}
      </span>
      <span className="text-canvas/55">
        {status === "paused" ? "paused" : "focusing"}
      </span>
    </button>
  );
}
