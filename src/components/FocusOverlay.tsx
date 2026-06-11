import { useState } from "react";
import { useDataStore, selectArea } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { useTimerStore } from "@/logic/stores/timerStore";
import { useTicker } from "@/logic/useTicker";
import { shouldNudge } from "@/logic/idle";
import { formatDuration } from "@/lib/dates";
import type { Task } from "@/data/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/**
 * Distraction-free focus mode. Rendered globally (from AppShell) as a
 * full-screen takeover whenever a session is running and not minimized — large
 * timer, current tasks, minimal chrome. Also hosts the idle "Still working?"
 * nudge and the stop/reflection flow.
 */
export function FocusOverlay() {
  const uid = useUid();
  const areas = useDataStore((s) => s.areas);
  const tasks = useDataStore((s) => s.tasks);

  const {
    status,
    areaId,
    taskIds,
    completedTaskIds,
    lastInteraction,
    minimized,
    elapsedSeconds,
    pause,
    resume,
    ping,
    setMinimized,
    toggleTask,
    stop,
    cancel,
  } = useTimerStore();

  // Tick every second while running so the clock and idle check stay live.
  const now = useTicker(status === "running");
  const seconds = elapsedSeconds(now);
  const idle = status === "running" && shouldNudge(lastInteraction, now);

  const [showStop, setShowStop] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (status === "idle" || minimized) return null;

  const area = selectArea(areas, areaId);
  const sessionTasks: Task[] = taskIds
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => Boolean(t));

  async function confirmStop() {
    if (!uid) return;
    setSaving(true);
    try {
      await stop(uid, note);
      setShowStop(false);
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  const accent = area?.color ?? "#0f172a";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
      style={{
        // Calm wash of the area's color over a near-black canvas.
        background: `radial-gradient(120% 120% at 50% 0%, ${accent}22 0%, #0b1220 60%, #070b14 100%)`,
        color: "#f8fafc",
      }}
    >
      {/* Minimal top chrome: minimize only. */}
      <button
        onClick={() => setMinimized(true)}
        className="absolute right-5 top-5 rounded-lg px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
        title="Minimize (keeps the timer running)"
      >
        Minimize ↘
      </button>

      {area && (
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
          <span aria-hidden>{area ? "●" : ""}</span>
          <span style={{ color: accent }}>{area.name}</span>
        </div>
      )}

      <div className="font-mono text-7xl font-semibold tabular-nums md:text-8xl">
        {formatDuration(seconds)}
      </div>
      <div className="mt-2 text-sm uppercase tracking-widest text-white/50">
        {status === "paused" ? "Paused" : "Focusing"}
      </div>

      <div className="mt-8 flex gap-3">
        {status === "running" ? (
          <button
            onClick={pause}
            className="rounded-xl bg-white/10 px-6 py-2.5 font-medium hover:bg-white/20"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={resume}
            className="rounded-xl px-6 py-2.5 font-medium text-ink"
            style={{ backgroundColor: "#f8fafc" }}
          >
            Resume
          </button>
        )}
        <button
          onClick={() => setShowStop(true)}
          className="rounded-xl bg-red-500/90 px-6 py-2.5 font-medium hover:bg-red-500"
        >
          Stop
        </button>
      </div>

      {sessionTasks.length > 0 && (
        <ul className="mt-10 w-full max-w-sm text-left">
          {sessionTasks.map((t) => {
            const done = completedTaskIds.includes(t.id);
            return (
              <li key={t.id} className="mb-2">
                <label className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => uid && toggleTask(uid, t.id)}
                    className="h-4 w-4"
                  />
                  <span className={done ? "text-white/40 line-through" : ""}>
                    {t.title}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <button
        onClick={cancel}
        className="mt-10 text-xs text-white/40 hover:text-red-300"
      >
        Discard session
      </button>

      {/* Idle / long-session nudge */}
      {idle && !showStop && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-6 max-w-sm rounded-2xl bg-surface p-6 text-center text-ink shadow-xl">
            <div className="text-2xl">👋</div>
            <h2 className="mt-2 text-lg font-semibold">Still working?</h2>
            <p className="mt-1 text-sm text-muted">
              No activity for a while. Keep the timer running, or pause it so
              your logged time stays accurate.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="subtle" onClick={pause}>
                Pause
              </Button>
              <Button onClick={ping}>Yes, keep going</Button>
            </div>
          </div>
        </div>
      )}

      {/* Stop / reflection */}
      <Modal
        open={showStop}
        onClose={() => setShowStop(false)}
        title="Wrap up this session"
      >
        <p className="mb-3 text-sm text-muted">
          You focused for{" "}
          <strong className="text-ink">{formatDuration(seconds)}</strong>. Add a
          quick reflection (optional).
        </p>
        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Got the proposal done, blocked on X…"
          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowStop(false)}>
            Keep going
          </Button>
          <Button onClick={confirmStop} disabled={saving}>
            Save session
          </Button>
        </div>
      </Modal>
    </div>
  );
}
