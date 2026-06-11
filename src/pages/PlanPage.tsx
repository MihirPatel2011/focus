import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataStore, selectArea } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { updateTask } from "@/data/tasks";
import { setTaskCompletion } from "@/logic/taskActions";
import { plannedFor, planningBacklog } from "@/logic/taskViews";
import { todayIso, weekDays, formatDateLabel } from "@/lib/dates";
import type { Task } from "@/data/types";
import { AreaBadge } from "@/components/AreaBadge";
import { URGENCY_LABELS } from "@/components/ClarifyFields";
import { Button } from "@/components/ui/Button";

type Mode = "today" | "week";

/**
 * Daily / weekly planning — a focused space, separate from the full backlog,
 * for laying out what you intend to work on. Setting `plannedFor` on a task is
 * the whole mechanism; this is the front door to the focus timer.
 */
export function PlanPage() {
  const [mode, setMode] = useState<Mode>("today");

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="page-title">Plan</h1>
          <p className="text-sm text-muted">
            Lay out what you intend to do, then focus on it.
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-sunken p-1">
          {(["today", "week"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                mode === m ? "bg-surface shadow-sm" : "text-muted"
              }`}
            >
              {m === "today" ? "Today" : "This week"}
            </button>
          ))}
        </div>
      </header>

      {mode === "today" ? <TodayView /> : <WeekView />}
    </div>
  );
}

// ──────────────────────────── Today view ────────────────────────────

function TodayView() {
  const uid = useUid();
  const navigate = useNavigate();
  const tasks = useDataStore((s) => s.tasks);
  const areas = useDataStore((s) => s.areas);
  const today = todayIso();

  const planned = plannedFor(tasks, today);
  const backlog = planningBacklog(tasks, today);

  const setPlan = (task: Task, iso: string | undefined) =>
    uid && updateTask(uid, task.id, { plannedFor: iso });

  function focusTask(task: Task) {
    // Hand off to the timer with this task's area/project preselected.
    navigate("/focus", {
      state: {
        areaId: task.areaId,
        projectId: task.projectId,
        taskIds: [task.id],
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="label-caps">
            Today · {formatDateLabel(today)}
          </h2>
          {planned.length > 0 && (
            <Button onClick={() => navigate("/focus")} className="px-3 py-1.5">
              Start focus
            </Button>
          )}
        </div>

        {planned.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line2/70 px-6 py-12 text-center text-sm text-muted">
            Nothing planned for today. Pull tasks from your backlog below.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {planned.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 card px-3 py-2.5"
                style={
                  selectArea(areas, task.areaId)
                    ? {
                        borderLeft: `3px solid ${
                          selectArea(areas, task.areaId)!.color
                        }`,
                      }
                    : undefined
                }
              >
                <input
                  type="checkbox"
                  checked={task.status === "done"}
                  onChange={() =>
                    uid && setTaskCompletion(uid, task, task.status !== "done")
                  }
                  className="h-4 w-4 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                      style={{
                        backgroundColor: URGENCY_LABELS[task.urgency].color,
                      }}
                    />
                    {task.title}
                  </div>
                  <div className="mt-1">
                    <AreaBadge area={selectArea(areas, task.areaId)} />
                  </div>
                </div>
                <button
                  onClick={() => focusTask(task)}
                  className="rounded-lg bg-ink/[0.06] px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ink/10"
                  title="Start a focus session on this task"
                >
                  Focus
                </button>
                <button
                  onClick={() => setPlan(task, undefined)}
                  className="text-xs text-muted hover:text-[#b3361b]"
                  title="Remove from today"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="label-caps mb-2">Backlog</h2>
        {backlog.length === 0 ? (
          <p className="text-sm text-muted">
            No actionable tasks — everything is planned, done, or still in your
            inbox.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {backlog.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 card px-3 py-2 text-sm"
              >
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: URGENCY_LABELS[task.urgency].color,
                  }}
                />
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                <AreaBadge area={selectArea(areas, task.areaId)} />
                {task.plannedFor && (
                  <span className="text-xs text-muted">
                    {formatDateLabel(task.plannedFor)}
                  </span>
                )}
                <button
                  onClick={() => setPlan(task, today)}
                  className="rounded-md bg-ink px-2 py-1 text-xs font-medium text-white hover:opacity-90"
                >
                  + Today
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ───────────────────────────── Week view ─────────────────────────────

function WeekView() {
  const uid = useUid();
  const tasks = useDataStore((s) => s.tasks);
  const areas = useDataStore((s) => s.areas);
  const days = weekDays();
  const weekIsos = days.map((d) => d.iso);

  const setPlan = (task: Task, iso: string | undefined) =>
    uid && updateTask(uid, task.id, { plannedFor: iso });

  // Backlog for the week = actionable tasks not planned within this week.
  const backlog = tasks
    .filter(
      (t) =>
        t.status !== "done" &&
        t.areaId &&
        (!t.plannedFor || !weekIsos.includes(t.plannedFor)),
    )
    .sort((a, b) => b.urgency - a.urgency);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const dayTasks = plannedFor(tasks, day.iso);
          return (
            <div
              key={day.iso}
              className={`rounded-xl border p-2 ${
                day.isToday
                  ? "border-ink/40 bg-surface"
                  : "border-line bg-surface/60"
              }`}
            >
              <div className="mb-2 flex items-baseline justify-between px-1">
                <span
                  className={`text-xs font-semibold ${
                    day.isToday ? "text-ink" : "text-muted"
                  }`}
                >
                  {day.weekday}
                </span>
                <span className="text-xs text-muted">{day.dayOfMonth}</span>
              </div>
              <ul className="flex min-h-[40px] flex-col gap-1">
                {dayTasks.map((task) => {
                  const area = selectArea(areas, task.areaId);
                  return (
                    <li
                      key={task.id}
                      className="group flex items-start gap-1 rounded-md px-1.5 py-1 text-xs"
                      style={{
                        backgroundColor: area ? `${area.color}14` : undefined,
                      }}
                    >
                      <span
                        className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: area?.color ?? "#94a3b8" }}
                      />
                      <span className="min-w-0 flex-1 break-words">
                        {task.title}
                      </span>
                      <button
                        onClick={() => setPlan(task, undefined)}
                        className="text-muted opacity-0 group-hover:opacity-100 hover:text-[#b3361b]"
                        title="Unplan"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <section>
        <h2 className="label-caps mb-2">
          Backlog — assign to a day
        </h2>
        {backlog.length === 0 ? (
          <p className="text-sm text-muted">Nothing left to schedule.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {backlog.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-2 card px-3 py-2 text-sm sm:flex-row sm:items-center"
              >
                <span className="min-w-0 flex-1 truncate">
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                    style={{
                      backgroundColor: URGENCY_LABELS[task.urgency].color,
                    }}
                  />
                  {task.title}
                </span>
                <AreaBadge area={selectArea(areas, task.areaId)} />
                <div className="flex gap-1">
                  {days.map((day) => (
                    <button
                      key={day.iso}
                      onClick={() => setPlan(task, day.iso)}
                      className={`h-7 w-7 rounded-md text-xs font-medium ${
                        day.isToday
                          ? "bg-ink/10 text-ink"
                          : "bg-ink/[0.05] text-muted hover:bg-ink/10 hover:text-ink"
                      }`}
                      title={`Plan for ${day.weekday} ${day.dayOfMonth}`}
                    >
                      {day.weekday[0]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
