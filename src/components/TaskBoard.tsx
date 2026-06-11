import { useMemo, useState } from "react";
import { useDataStore, selectArea } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { updateTask } from "@/data/tasks";
import { setTaskCompletion } from "@/logic/taskActions";
import {
  filterTasks,
  sortTasks,
  statusForArea,
  type TaskSort,
  type TaskView,
} from "@/logic/taskViews";
import type { Task } from "@/data/types";
import { isOverdue, isToday, formatDateLabel } from "@/lib/dates";
import { URGENCY_LABELS } from "@/components/ClarifyFields";
import { EditTaskModal } from "@/components/EditTaskModal";

type GroupBy = "none" | "area" | "project";

const VIEWS: { key: TaskView; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "nodate", label: "No date" },
  { key: "all", label: "All" },
  { key: "done", label: "Done" },
];

/**
 * Rich, reusable task list: view filters, group by area/project, sort, inline
 * area changing, and a recurrence indicator. Used on both Home and Tasks.
 */
export function TaskBoard({ defaultView = "all" }: { defaultView?: TaskView }) {
  const tasks = useDataStore((s) => s.tasks);
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);

  const [view, setView] = useState<TaskView>(defaultView);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [sort, setSort] = useState<TaskSort>("urgency");
  const [editing, setEditing] = useState<Task | null>(null);

  const list = useMemo(
    () => sortTasks(filterTasks(tasks, view), sort),
    [tasks, view, sort],
  );

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: "", label: "", items: list }];
    const map = new Map<string, Task[]>();
    for (const t of list) {
      const key =
        groupBy === "area" ? (t.areaId ?? "__none") : (t.projectId ?? "__none");
      const arr = map.get(key);
      if (arr) arr.push(t);
      else map.set(key, [t]);
    }
    return [...map.entries()]
      .map(([key, items]) => ({
        key,
        label:
          groupBy === "area"
            ? (selectArea(areas, key === "__none" ? undefined : key)?.name ??
              "No area")
            : (projects.find((p) => p.id === key)?.name ?? "No project"),
        items,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [list, groupBy, areas, projects]);

  return (
    <div>
      {/* View filters — segmented scroll row on mobile. */}
      <div className="-mx-1 mb-3 flex items-center gap-1.5 overflow-x-auto px-1 pb-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
              view === v.key
                ? "bg-ink text-canvas shadow-soft"
                : "text-soft hover:bg-ink/5"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Group + sort controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="select-pill"
          aria-label="Group tasks"
        >
          <option value="none">No grouping</option>
          <option value="area">Group · area</option>
          <option value="project">Group · project</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as TaskSort)}
          className="select-pill"
          aria-label="Sort tasks"
        >
          <option value="urgency">Sort · urgency</option>
          <option value="dueDate">Sort · due date</option>
          <option value="area">Sort · area</option>
        </select>
        <span className="ml-auto text-xs tabular-nums text-muted">
          {list.length} task{list.length === 1 ? "" : "s"}
        </span>
      </div>

      {list.length === 0 ? (
        <EmptyState view={view} />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <div key={g.key}>
              {g.label && (
                <h3 className="label-caps mb-2">
                  {g.label}{" "}
                  <span className="font-normal normal-case tracking-normal">
                    · {g.items.length}
                  </span>
                </h3>
              )}
              <ul className="card divide-y divide-line/60 overflow-hidden">
                {g.items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={() => setEditing(task)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditTaskModal task={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function EmptyState({ view }: { view: TaskView }) {
  const copy: Record<TaskView, string> = {
    today: "Nothing due today. Plan something, or enjoy the quiet.",
    upcoming: "The next seven days are clear.",
    overdue: "Nothing overdue. Keep it that way.",
    nodate: "Every task has a date. Tidy.",
    inbox: "Inbox is empty.",
    all: "No open tasks — press n to capture one.",
    done: "Nothing completed yet. It'll feel good when there is.",
  };
  return (
    <div className="rounded-2xl border border-dashed border-line2/70 px-6 py-14 text-center">
      <div
        aria-hidden
        className="mx-auto mb-3 h-10 w-10 rounded-full border-[1.5px] border-line2"
        style={{
          background:
            "radial-gradient(closest-side, rgb(194 65 12 / 0.10), transparent)",
        }}
      />
      <p className="text-sm text-muted">{copy[view]}</p>
    </div>
  );
}

function TaskRow({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const uid = useUid();
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);
  const area = selectArea(areas, task.areaId);
  const project = projects.find((p) => p.id === task.projectId);
  const overdue = isOverdue(task.dueDate);
  const dueToday = isToday(task.dueDate);
  const done = task.status === "done";
  const steps = task.checklist ?? [];
  const stepsDone = steps.filter((s) => s.done).length;

  return (
    <li className="group flex items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-ink/[0.025] sm:px-4">
      {/* Area color as a quiet left tick, not a heavy border. */}
      <span
        aria-hidden
        className="h-7 w-[3px] shrink-0 rounded-full"
        style={{ backgroundColor: area?.color ?? "transparent" }}
      />
      <input
        type="checkbox"
        checked={done}
        onChange={() => uid && setTaskCompletion(uid, task, !done)}
        aria-label={done ? "Reopen task" : "Complete task"}
      />

      <button onClick={onEdit} className="min-w-0 flex-1 py-0.5 text-left">
        <div
          className={`truncate text-[15px] transition-colors ${
            done ? "text-muted line-through decoration-line2" : "text-ink"
          }`}
        >
          {task.title}
          {task.recurrence && (
            <span className="ml-1.5 text-[13px] text-muted" title="Repeats">
              ↻
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span
            className="font-medium"
            style={{ color: URGENCY_LABELS[task.urgency].color }}
          >
            {URGENCY_LABELS[task.urgency].label}
          </span>
          {steps.length > 0 && (
            <span
              className={
                stepsDone === steps.length
                  ? "tabular-nums text-[#7d8a4e]"
                  : "tabular-nums text-muted"
              }
              title="Checklist progress"
            >
              · {stepsDone}/{steps.length}
            </span>
          )}
          {project && (
            <span className="text-muted">
              · {project.name}
            </span>
          )}
          {task.dueDate && (
            <span
              className={
                overdue
                  ? "font-semibold text-[#b3361b]"
                  : dueToday
                    ? "font-semibold text-ember"
                    : "text-muted"
              }
            >
              · {overdue ? "overdue " : dueToday ? "today " : ""}
              {formatDateLabel(task.dueDate)}
            </span>
          )}
        </div>
      </button>

      {/* Inline area change — always reachable, quiet until hover on desktop. */}
      <select
        value={task.areaId ?? ""}
        onChange={(e) => {
          if (!uid) return;
          const areaId = e.target.value || undefined;
          updateTask(uid, task.id, {
            areaId,
            projectId:
              project && project.areaId !== areaId ? undefined : task.projectId,
            status: done ? task.status : statusForArea(areaId),
          });
        }}
        onClick={(e) => e.stopPropagation()}
        className="select-pill max-w-24 shrink-0 truncate sm:max-w-32 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100 sm:focus:opacity-100"
        title="Change area"
        style={area ? { color: area.color, borderColor: `${area.color}55` } : undefined}
      >
        <option value="">No area</option>
        {areas
          .filter((a) => !a.archived)
          .map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
      </select>
    </li>
  );
}
