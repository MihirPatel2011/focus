import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useDataStore, selectArea } from "@/logic/stores/dataStore";
import { useTimerStore } from "@/logic/stores/timerStore";
import { useTicker } from "@/logic/useTicker";
import { formatDuration } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { AreaBadge } from "@/components/AreaBadge";

/**
 * Focus page. When idle it's the session setup (pick area + project + tasks).
 * The running session itself is shown in the global distraction-free overlay
 * (see FocusOverlay); when that overlay is minimized this page shows a small
 * panel to jump back into focus mode.
 */
export function FocusPage() {
  const status = useTimerStore((s) => s.status);
  return status === "idle" ? <TimerSetup /> : <SessionMinimized />;
}

// ──────────────────────────── Setup ────────────────────────────

/** Preselection passed via navigation state (e.g. from the planning view). */
interface FocusPreset {
  areaId?: string;
  projectId?: string;
  taskIds?: string[];
}

function TimerSetup() {
  const areas = useDataStore((s) => s.areas).filter((a) => !a.archived);
  const projects = useDataStore((s) => s.projects).filter((p) => !p.archived);
  const tasks = useDataStore((s) => s.tasks);
  const configure = useTimerStore((s) => s.configure);
  const start = useTimerStore((s) => s.start);

  // A planned task can hand off here with its area/project/task preselected.
  const preset = (useLocation().state as FocusPreset | null) ?? {};
  const [areaId, setAreaId] = useState<string>(preset.areaId ?? "");
  const [projectId, setProjectId] = useState<string>(preset.projectId ?? "");
  const [selected, setSelected] = useState<string[]>(preset.taskIds ?? []);

  const areaProjects = projects.filter((p) => p.areaId === areaId);
  // Candidate tasks: open tasks in the chosen area (and project, if set).
  const candidates = tasks.filter(
    (t) =>
      t.status !== "done" &&
      t.areaId === areaId &&
      (!projectId || t.projectId === projectId),
  );

  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  function begin() {
    if (!areaId) return;
    configure({ areaId, projectId: projectId || undefined, taskIds: selected });
    start();
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="page-title">Focus</h1>
        <p className="text-sm text-muted">
          Pick one area, an optional project, and the tasks you'll work on.
        </p>
      </header>

      {areas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line2/70 px-6 py-14 text-center text-sm text-muted">
          Create an area first, then come back to start a focus session.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <label className="text-sm">
            <span className="label-caps mb-1.5 block">
              Area
            </span>
            <select
              value={areaId}
              onChange={(e) => {
                setAreaId(e.target.value);
                setProjectId("");
                setSelected([]);
              }}
              className="input-base"
            >
              <option value="">— choose an area —</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          {areaId && areaProjects.length > 0 && (
            <label className="text-sm">
              <span className="label-caps mb-1.5 block">
                Project (optional)
              </span>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setSelected([]);
                }}
                className="input-base"
              >
                <option value="">— none —</option>
                {areaProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {areaId && (
            <div>
              <div className="label-caps mb-1.5">
                Tasks to work on
              </div>
              {candidates.length === 0 ? (
                <p className="text-sm text-muted">
                  No open tasks in this area — you can still run a session.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {candidates.map((t) => (
                    <li key={t.id}>
                      <label className="flex items-center gap-2 card px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.includes(t.id)}
                          onChange={() => toggle(t.id)}
                        />
                        {t.title}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Button onClick={begin} disabled={!areaId} className="self-start">
            Start focus session
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────── Minimized session ───────────────────────

/**
 * Shown on the /focus route while a session is running. The real running UI is
 * the full-screen overlay; this panel only matters when the overlay has been
 * minimized, giving a clear way back into focus mode.
 */
function SessionMinimized() {
  const areas = useDataStore((s) => s.areas);
  const areaId = useTimerStore((s) => s.areaId);
  const status = useTimerStore((s) => s.status);
  const elapsedSeconds = useTimerStore((s) => s.elapsedSeconds);
  const setMinimized = useTimerStore((s) => s.setMinimized);
  const now = useTicker(status === "running");
  const area = selectArea(areas, areaId);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      {area && <AreaBadge area={area} className="mb-4" />}
      <div className="font-mono text-5xl font-semibold tabular-nums">
        {formatDuration(elapsedSeconds(now))}
      </div>
      <div className="mt-2 text-sm text-muted">
        {status === "paused" ? "Session paused" : "Session in progress"}
      </div>
      <Button className="mt-6" onClick={() => setMinimized(false)}>
        Open focus mode
      </Button>
    </div>
  );
}
