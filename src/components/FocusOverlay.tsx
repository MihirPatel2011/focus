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
 * Distraction-free focus mode: a full-screen warm-black room tinted with the
 * area's color. Large timer, current tasks, minimal chrome. Hosts the idle
 * "Still working?" nudge and the stop/reflection flow.
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

  const accent = area?.color ?? "#c2410c";

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex flex-col items-center justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-center"
      style={{
        background: `radial-gradient(110% 90% at 50% -10%, ${accent}3a 0%, transparent 60%), #100d0a`,
        color: "#f4f1ea",
      }}
    >
      {/* Grain to keep the dark room from feeling flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <button
        onClick={() => setMinimized(true)}
        className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] rounded-xl px-3.5 py-2 text-xs font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        title="Minimize — keeps the timer running"
      >
        Minimize ↘
      </button>

      {area && (
        <div className="animate-rise mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm backdrop-blur">
          <span
            aria-hidden
            className={`inline-block h-2 w-2 rounded-full ${
              status === "running" ? "animate-breathe" : ""
            }`}
            style={{ backgroundColor: accent }}
          />
          <span className="font-medium text-white/85">{area.name}</span>
        </div>
      )}

      <div
        className="animate-rise font-mono text-[clamp(4.5rem,18vw,8.5rem)] font-light leading-none tracking-tight tabular-nums"
        style={{ animationDelay: "60ms", textShadow: `0 0 80px ${accent}45` }}
      >
        {formatDuration(seconds)}
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
        {status === "paused" ? "Paused" : "Focusing"}
      </div>

      <div
        className="animate-rise mt-9 flex gap-3"
        style={{ animationDelay: "120ms" }}
      >
        {status === "running" ? (
          <button
            onClick={pause}
            className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.08] px-6 py-3 font-medium backdrop-blur transition-all duration-200 hover:bg-white/[0.14] active:scale-[0.97]"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={resume}
            className="min-w-28 rounded-2xl bg-[#f4f1ea] px-6 py-3 font-semibold text-[#1f1b16] transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
          >
            Resume
          </button>
        )}
        <button
          onClick={() => setShowStop(true)}
          className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 font-medium text-white/80 backdrop-blur transition-all duration-200 hover:border-[#e0654a]/40 hover:bg-[#b3361b]/25 hover:text-white active:scale-[0.97]"
        >
          Stop
        </button>
      </div>

      {sessionTasks.length > 0 && (
        <ul
          className="animate-rise mt-11 w-full max-w-sm text-left"
          style={{ animationDelay: "180ms" }}
        >
          {sessionTasks.map((t) => {
            const done = completedTaskIds.includes(t.id);
            return (
              <li key={t.id} className="mb-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.05] px-4 py-3 backdrop-blur transition-colors duration-150 hover:bg-white/[0.09]">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => uid && toggleTask(uid, t.id)}
                    className="check-light"
                  />
                  <span
                    className={`text-[15px] transition-colors ${
                      done ? "text-white/35 line-through" : "text-white/90"
                    }`}
                  >
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
        className="mt-10 text-xs text-white/30 transition-colors hover:text-[#e0654a]"
      >
        Discard session
      </button>

      {/* Idle / long-session nudge */}
      {idle && !showStop && (
        <div className="animate-fade absolute inset-0 z-10 flex items-center justify-center bg-black/55 backdrop-blur-md">
          <div className="animate-pop card mx-6 max-w-sm p-7 text-center text-ink">
            <div aria-hidden className="text-3xl">
              👋
            </div>
            <h2 className="font-display mt-2 text-xl font-semibold">
              Still working?
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              No activity for a while. Keep going, or pause so your logged time
              stays honest.
            </p>
            <div className="mt-6 flex justify-center gap-2">
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
        <p className="mb-4 text-sm text-muted">
          You focused for{" "}
          <strong className="font-mono font-semibold text-ink tabular-nums">
            {formatDuration(seconds)}
          </strong>
          . Add a quick reflection — future-you will thank you.
        </p>
        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Got the proposal done, blocked on X…"
          className="input-base resize-none"
        />
        <div className="mt-5 flex justify-end gap-2">
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
