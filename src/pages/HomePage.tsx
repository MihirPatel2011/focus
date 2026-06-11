import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDataStore, selectArea } from "@/logic/stores/dataStore";
import { useAuthStore } from "@/logic/stores/authStore";
import { formatDuration } from "@/lib/dates";
import { AreaBadge } from "@/components/AreaBadge";

/**
 * Lightweight dashboard for this slice: today's focused time, tasks done today,
 * and top areas. The full statistics/charts dashboard comes in a later session.
 */
export function HomePage() {
  const email = useAuthStore((s) => s.user?.email);
  const tasks = useDataStore((s) => s.tasks);
  const areas = useDataStore((s) => s.areas);
  const timeLogs = useDataStore((s) => s.timeLogs);
  const loaded = useDataStore((s) => s.loaded);

  const stats = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dayMs = startOfDay.getTime();

    const todayLogs = timeLogs.filter((l) => l.startTime >= dayMs);
    const focusedToday = todayLogs.reduce((s, l) => s + l.durationSeconds, 0);

    const doneToday = tasks.filter(
      (t) => t.completedAt && t.completedAt >= dayMs,
    ).length;

    // Top areas by focused seconds today.
    const byArea = new Map<string, number>();
    for (const l of todayLogs)
      byArea.set(l.areaId, (byArea.get(l.areaId) ?? 0) + l.durationSeconds);
    const topAreas = [...byArea.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const inboxCount = tasks.filter((t) => t.status === "inbox").length;

    return { focusedToday, doneToday, topAreas, inboxCount };
  }, [tasks, timeLogs]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          {email ? ` · ${email}` : ""}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Focused today" value={formatDuration(stats.focusedToday)} />
        <Stat label="Tasks done" value={String(stats.doneToday)} />
        <Stat label="Inbox" value={String(stats.inboxCount)} to="/inbox" />
      </div>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium text-muted">
          Where time went today
        </h2>
        {stats.topAreas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            No focus sessions yet today.{" "}
            <Link to="/focus" className="font-medium text-ink hover:underline">
              Start one →
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {stats.topAreas.map(([areaId, secs]) => (
              <li
                key={areaId}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3"
              >
                <AreaBadge area={selectArea(areas, areaId)} />
                <span className="text-sm font-medium tabular-nums">
                  {formatDuration(secs)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!loaded && <p className="mt-6 text-sm text-muted">Syncing…</p>}

      <div className="mt-8 flex gap-3">
        <Link
          to="/focus"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Start focus session
        </Link>
        <Link
          to="/tasks"
          className="rounded-lg bg-line/50 px-4 py-2 text-sm font-medium hover:bg-line"
        >
          View tasks
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  to,
}: {
  label: string;
  value: string;
  to?: string;
}) {
  const body = (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}
