import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDataStore } from "@/logic/stores/dataStore";
import { isInbox } from "@/logic/taskViews";
import { isOverdue, formatDuration } from "@/lib/dates";
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
      inbox: tasks.filter(isInbox).length,
    };
  }, [tasks, timeLogs]);

  return (
    <div>
      <header className="mb-6">
        <p className="label-caps mb-1">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="flex items-end justify-between gap-3">
          <h1 className="page-title">Today</h1>
          <Link
            to="/focus"
            className="hidden rounded-xl bg-ink/[0.06] px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/10 sm:block"
          >
            Start focus →
          </Link>
        </div>
      </header>

      <div className="mb-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <Stat label="Focused" value={formatDuration(stats.focusedToday)} />
        <Stat label="Done today" value={String(stats.doneToday)} />
        <Stat
          label="Overdue"
          value={String(stats.overdue)}
          danger={stats.overdue > 0}
        />
        <Stat label="Inbox" value={String(stats.inbox)} to="/inbox" />
      </div>

      <TaskBoard defaultView="all" />

      {/* Mobile path to the rest of the app (kept off the tab bar). */}
      <div className="mt-8 flex gap-2 md:hidden">
        {[
          { to: "/areas", label: "Areas" },
          { to: "/projects", label: "Projects" },
          { to: "/stats", label: "Stats" },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex-1 rounded-xl bg-ink/[0.05] px-3 py-2.5 text-center text-sm font-medium text-soft transition-colors hover:bg-ink/10 hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
      </div>
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
    <div className="card px-4 py-3.5 transition-shadow duration-200 hover:shadow-lift">
      <div className="label-caps">{label}</div>
      <div
        className={`mt-1 font-mono text-[1.45rem] font-semibold leading-none tracking-tight tabular-nums ${
          danger ? "text-[#b3361b]" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}
