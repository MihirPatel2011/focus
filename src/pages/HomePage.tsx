import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDataStore } from "@/logic/stores/dataStore";
import { isInbox } from "@/logic/taskViews";
import { isOverdue, isToday, formatDuration } from "@/lib/dates";
import { TaskBoard } from "@/components/TaskBoard";

/**
 * Home is the task hub: a compact "today" summary on top, then the full
 * task board (every view, groupable by area/project, sortable).
 */
export function HomePage() {
  const tasks = useDataStore((s) => s.tasks);
  const timeLogs = useDataStore((s) => s.timeLogs);

  const stats = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dayMs = startOfDay.getTime();

    const focusedToday = timeLogs
      .filter((l) => l.startTime >= dayMs)
      .reduce((s, l) => s + l.durationSeconds, 0);
    const doneToday = tasks.filter(
      (t) => t.completedAt && t.completedAt >= dayMs,
    ).length;

    const open = tasks.filter((t) => t.status !== "done");
    return {
      focusedToday,
      doneToday,
      overdue: open.filter((t) => isOverdue(t.dueDate)).length,
      today: open.filter((t) => isToday(t.dueDate) || t.plannedFor).length,
      inbox: tasks.filter(isInbox).length,
    };
  }, [tasks, timeLogs]);

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Focused today" value={formatDuration(stats.focusedToday)} />
        <Stat label="Done today" value={String(stats.doneToday)} />
        <Stat
          label="Overdue"
          value={String(stats.overdue)}
          danger={stats.overdue > 0}
        />
        <Stat label="Inbox" value={String(stats.inbox)} to="/inbox" />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Your tasks</h2>
        <Link to="/focus" className="text-sm font-medium text-ink hover:underline">
          Start focus →
        </Link>
      </div>

      <TaskBoard defaultView="all" />
    </div>
  );
}

function Stat({
  label,
  value,
  to,
  danger,
}: {
  label: string;
  value: string;
  to?: string;
  danger?: boolean;
}) {
  const body = (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div
        className={`mt-1 text-xl font-semibold tabular-nums ${danger ? "text-red-600" : ""}`}
      >
        {value}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}
