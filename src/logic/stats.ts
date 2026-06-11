/**
 * Statistics engine — pure, framework-agnostic aggregation over the raw data.
 *
 * Everything here takes plain arrays (TimeLogs, Tasks, Areas, Projects) plus a
 * date range and returns chart-ready objects. No React, no Firestore, no
 * Recharts — so the same calculations can back a native build or be unit-tested
 * in isolation. The UI (StatsPage) only formats and renders these results.
 */
import type { Area, Project, Task, TimeLog } from "@/data/types";

// ───────────────────────────── Date ranges ─────────────────────────────

export type RangePreset = "today" | "week" | "month" | "30days" | "custom";

export interface DateRange {
  /** Inclusive start (epoch ms). */
  start: number;
  /** Exclusive end (epoch ms). */
  end: number;
  /** Number of whole days the range spans (used to prorate weekly goals). */
  days: number;
  preset: RangePreset;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Monday-based start of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Mon=0 … Sun=6
  x.setDate(x.getDate() - day);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Build a range from a preset (relative to `now`). */
export function buildRange(preset: RangePreset, now = new Date()): DateRange {
  const today = startOfDay(now);
  switch (preset) {
    case "today": {
      const end = addDays(today, 1);
      return { start: today.getTime(), end: end.getTime(), days: 1, preset };
    }
    case "week": {
      const start = startOfWeek(now);
      const end = addDays(start, 7);
      return { start: start.getTime(), end: end.getTime(), days: 7, preset };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const days = Math.round(
        (end.getTime() - start.getTime()) / 86_400_000,
      );
      return { start: start.getTime(), end: end.getTime(), days, preset };
    }
    case "30days":
    default: {
      const end = addDays(today, 1);
      const start = addDays(today, -29);
      return { start: start.getTime(), end: end.getTime(), days: 30, preset };
    }
  }
}

/** Build a custom range from two ISO date strings (inclusive of both days). */
export function customRange(startIso: string, endIso: string): DateRange {
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd).getTime();
  const end = new Date(ey, em - 1, ed + 1).getTime(); // exclusive end
  const days = Math.max(1, Math.round((end - start) / 86_400_000));
  return { start, end, days, preset: "custom" };
}

const inRange = (ms: number, r: DateRange) => ms >= r.start && ms < r.end;

// ───────────────────────────── Result types ────────────────────────────

export interface AreaSlice {
  areaId: string;
  name: string;
  color: string;
  seconds: number;
}

export interface ProjectSlice {
  projectId: string;
  name: string;
  color: string; // inherits the parent area's color
  seconds: number;
}

export interface DayPoint {
  /** ISO date "YYYY-MM-DD". */
  date: string;
  /** Short label for the axis, e.g. "Jun 10". */
  label: string;
  completed: number;
  focusedHours: number;
}

export interface EstimateVsActual {
  taskId: string;
  title: string;
  estimateMinutes: number;
  actualMinutes: number;
}

export interface GoalVsActual {
  areaId: string;
  name: string;
  color: string;
  actualHours: number;
  /** Weekly goal prorated to the selected range length. */
  goalHours: number;
  pct: number;
}

export interface Stats {
  totalSeconds: number;
  sessionCount: number;
  tasksCompleted: number;
  byArea: AreaSlice[];
  byProject: ProjectSlice[];
  perDay: DayPoint[];
  estimateVsActual: EstimateVsActual[];
  goalVsActual: GoalVsActual[];
}

// ─────────────────────────────── Engine ────────────────────────────────

const UNCATEGORIZED = "#94a3b8"; // slate-400 for missing area/project

/**
 * Attribute a session's duration across the tasks worked on in it. A session
 * with N tasks splits its time equally — a defensible estimate when we don't
 * track per-task timing within a session.
 */
function actualMinutesByTask(logs: TimeLog[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const log of logs) {
    if (!log.taskIds?.length) continue;
    const share = log.durationSeconds / log.taskIds.length / 60;
    for (const id of log.taskIds) {
      out.set(id, (out.get(id) ?? 0) + share);
    }
  }
  return out;
}

export function computeStats(
  range: DateRange,
  timeLogs: TimeLog[],
  tasks: Task[],
  areas: Area[],
  projects: Project[],
): Stats {
  const areaById = new Map(areas.map((a) => [a.id, a]));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const logs = timeLogs.filter((l) => inRange(l.startTime, range));

  // Totals.
  const totalSeconds = logs.reduce((s, l) => s + l.durationSeconds, 0);

  // By area.
  const areaSecs = new Map<string, number>();
  for (const l of logs)
    areaSecs.set(l.areaId, (areaSecs.get(l.areaId) ?? 0) + l.durationSeconds);
  const byArea: AreaSlice[] = [...areaSecs.entries()]
    .map(([areaId, seconds]) => {
      const a = areaById.get(areaId);
      return {
        areaId,
        name: a?.name ?? "Unknown",
        color: a?.color ?? UNCATEGORIZED,
        seconds,
      };
    })
    .sort((a, b) => b.seconds - a.seconds);

  // By project (color inherited from area).
  const projSecs = new Map<string, number>();
  for (const l of logs) {
    if (!l.projectId) continue;
    projSecs.set(
      l.projectId,
      (projSecs.get(l.projectId) ?? 0) + l.durationSeconds,
    );
  }
  const byProject: ProjectSlice[] = [...projSecs.entries()]
    .map(([projectId, seconds]) => {
      const p = projectById.get(projectId);
      const a = p ? areaById.get(p.areaId) : undefined;
      return {
        projectId,
        name: p?.name ?? "Unknown",
        color: a?.color ?? UNCATEGORIZED,
        seconds,
      };
    })
    .sort((a, b) => b.seconds - a.seconds);

  // Per-day series (completed tasks + focused hours) across the whole range.
  const perDay = buildDaySeries(range, logs, tasks);

  // Tasks completed within range.
  const tasksCompleted = tasks.filter(
    (t) => t.completedAt && inRange(t.completedAt, range),
  ).length;

  // Estimate vs actual: tasks with an estimate that were worked on in range.
  const actualByTask = actualMinutesByTask(logs);
  const estimateVsActual: EstimateVsActual[] = tasks
    .filter((t) => t.estimateMinutes != null && actualByTask.has(t.id))
    .map((t) => ({
      taskId: t.id,
      title: t.title,
      estimateMinutes: t.estimateMinutes!,
      actualMinutes: Math.round(actualByTask.get(t.id) ?? 0),
    }))
    .sort((a, b) => b.actualMinutes - a.actualMinutes)
    .slice(0, 12);

  // Goal vs actual: areas with a weekly goal, prorated to the range length.
  const weeks = range.days / 7;
  const goalVsActual: GoalVsActual[] = areas
    .filter((a) => !a.archived && a.weeklyTimeGoalHours)
    .map((a) => {
      const actualHours = (areaSecs.get(a.id) ?? 0) / 3600;
      const goalHours = (a.weeklyTimeGoalHours ?? 0) * weeks;
      return {
        areaId: a.id,
        name: a.name,
        color: a.color,
        actualHours,
        goalHours,
        pct: goalHours > 0 ? Math.round((actualHours / goalHours) * 100) : 0,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  return {
    totalSeconds,
    sessionCount: logs.length,
    tasksCompleted,
    byArea,
    byProject,
    perDay,
    estimateVsActual,
    goalVsActual,
  };
}

/** One point per day in the range (capped to keep the axis readable). */
function buildDaySeries(
  range: DateRange,
  logs: TimeLog[],
  tasks: Task[],
): DayPoint[] {
  const dayMs = 86_400_000;
  // Bucket by local ISO date.
  const completedByDate = new Map<string, number>();
  for (const t of tasks) {
    if (t.completedAt && t.completedAt >= range.start && t.completedAt < range.end) {
      const k = isoOf(t.completedAt);
      completedByDate.set(k, (completedByDate.get(k) ?? 0) + 1);
    }
  }
  const focusByDate = new Map<string, number>();
  for (const l of logs) {
    const k = isoOf(l.startTime);
    focusByDate.set(k, (focusByDate.get(k) ?? 0) + l.durationSeconds);
  }

  const points: DayPoint[] = [];
  for (let t = range.start; t < range.end; t += dayMs) {
    const iso = isoOf(t);
    points.push({
      date: iso,
      label: new Date(t).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      completed: completedByDate.get(iso) ?? 0,
      focusedHours: Math.round(((focusByDate.get(iso) ?? 0) / 3600) * 10) / 10,
    });
  }
  return points;
}

function isoOf(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
