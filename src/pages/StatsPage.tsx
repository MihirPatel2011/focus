import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDataStore } from "@/logic/stores/dataStore";
import {
  buildRange,
  computeStats,
  customRange,
  type RangePreset,
} from "@/logic/stats";
import { formatDuration, todayIso } from "@/lib/dates";

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "30days", label: "Last 30 days" },
];

function hours(seconds: number) {
  return `${(seconds / 3600).toFixed(1)} h`;
}

export function StatsPage() {
  const timeLogs = useDataStore((s) => s.timeLogs);
  const tasks = useDataStore((s) => s.tasks);
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);

  const [preset, setPreset] = useState<RangePreset>("week");
  const [customStart, setCustomStart] = useState(todayIso());
  const [customEnd, setCustomEnd] = useState(todayIso());

  const range = useMemo(
    () =>
      preset === "custom"
        ? customRange(customStart, customEnd)
        : buildRange(preset),
    [preset, customStart, customEnd],
  );

  const stats = useMemo(
    () => computeStats(range, timeLogs, tasks, areas, projects),
    [range, timeLogs, tasks, areas, projects],
  );

  const hasData = stats.totalSeconds > 0 || stats.tasksCompleted > 0;

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="text-sm text-muted">
          Am I spending time where I intend to?
        </p>
      </header>

      {/* Date-range picker */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              preset === p.key ? "bg-ink text-white" : "bg-line/50 text-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm ${
            preset === "custom" ? "bg-line" : "bg-line/50"
          }`}
        >
          <input
            type="date"
            value={customStart}
            max={customEnd}
            onChange={(e) => {
              setCustomStart(e.target.value);
              setPreset("custom");
            }}
            className="bg-transparent text-xs outline-none"
            aria-label="Range start"
          />
          <span className="text-muted">→</span>
          <input
            type="date"
            value={customEnd}
            min={customStart}
            onChange={(e) => {
              setCustomEnd(e.target.value);
              setPreset("custom");
            }}
            className="bg-transparent text-xs outline-none"
            aria-label="Range end"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Focused time" value={formatDuration(stats.totalSeconds)} />
        <Stat label="Sessions" value={String(stats.sessionCount)} />
        <Stat label="Tasks done" value={String(stats.tasksCompleted)} />
        <Stat
          label="Avg / session"
          value={
            stats.sessionCount
              ? formatDuration(stats.totalSeconds / stats.sessionCount)
              : "—"
          }
        />
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
          No focus sessions or completed tasks in this range yet.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Goal vs actual — the key feedback loop */}
          {stats.goalVsActual.length > 0 && (
            <Card title="Time goals vs. actual">
              <ul className="flex flex-col gap-3">
                {stats.goalVsActual.map((g) => (
                  <li key={g.areaId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{g.name}</span>
                      <span className="tabular-nums text-muted">
                        {g.actualHours.toFixed(1)} / {g.goalHours.toFixed(1)} h
                        <span
                          className="ml-2 font-medium"
                          style={{ color: g.pct >= 100 ? "#059669" : g.color }}
                        >
                          {g.pct}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, g.pct)}%`,
                          backgroundColor: g.color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Time by area: pie + bar, color-matched */}
          {stats.byArea.length > 0 && (
            <Card title="Time by area">
              <div className="grid gap-4 md:grid-cols-2">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={stats.byArea}
                      dataKey="seconds"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {stats.byArea.map((a) => (
                        <Cell key={a.areaId} fill={a.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatDuration(v)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={stats.byArea}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid horizontal={false} stroke="#eef2f7" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `${(v / 3600).toFixed(0)}h`}
                      fontSize={11}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      fontSize={11}
                    />
                    <Tooltip formatter={(v: number) => hours(v)} />
                    <Bar dataKey="seconds" radius={[0, 4, 4, 0]}>
                      {stats.byArea.map((a) => (
                        <Cell key={a.areaId} fill={a.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Time by project */}
          {stats.byProject.length > 0 && (
            <Card title="Time by project">
              <ResponsiveContainer width="100%" height={Math.max(160, stats.byProject.length * 38)}>
                <BarChart
                  data={stats.byProject}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid horizontal={false} stroke="#eef2f7" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${(v / 3600).toFixed(0)}h`}
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    fontSize={11}
                  />
                  <Tooltip formatter={(v: number) => hours(v)} />
                  <Bar dataKey="seconds" radius={[0, 4, 4, 0]}>
                    {stats.byProject.map((p) => (
                      <Cell key={p.projectId} fill={p.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Trend: tasks completed (and focused hours) over time */}
          <Card title="Activity over time">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.perDay} margin={{ left: -16, right: 8 }}>
                <CartesianGrid stroke="#eef2f7" />
                <XAxis dataKey="label" fontSize={11} minTickGap={20} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Tasks completed"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="focusedHours"
                  name="Focused hours"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Estimate vs actual */}
          {stats.estimateVsActual.length > 0 && (
            <Card title="Estimate vs. actual (minutes)">
              <ResponsiveContainer
                width="100%"
                height={Math.max(160, stats.estimateVsActual.length * 42)}
              >
                <BarChart
                  data={stats.estimateVsActual}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid horizontal={false} stroke="#eef2f7" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={110}
                    fontSize={11}
                    tickFormatter={(v: string) =>
                      v.length > 16 ? v.slice(0, 15) + "…" : v
                    }
                  />
                  <Tooltip formatter={(v: number) => `${v} min`} />
                  <Legend />
                  <Bar
                    dataKey="estimateMinutes"
                    name="Estimate"
                    fill="#cbd5e1"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="actualMinutes"
                    name="Actual"
                    fill="#2563eb"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  );
}
