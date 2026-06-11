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
];

/**
 * Rich, reusable task list: view filters (Today/Upcoming/Overdue/No date/All),
 * group by area or project, sort by urgency/due date, inline area changing, and
 * a recurrence indicator. Used on both Home and Tasks.
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
      {/* View filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              view === v.key ? "bg-ink text-white" : "bg-line/50 text-muted"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Group + sort controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1 text-muted">
          Group
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded-lg border border-line bg-surface px-2 py-1"
          >
            <option value="none">None</option>
            <option value="area">By area</option>
            <option value="project">By project</option>
          </select>
        </label>
        <label className="flex items-center gap-1 text-muted">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as TaskSort)}
            className="rounded-lg border border-line bg-surface px-2 py-1"
          >
            <option value="urgency">Urgency</option>
            <option value="dueDate">Due date</option>
            <option value="area">Area</option>
          </select>
        </label>
        <span className="ml-auto text-xs text-muted">
          {list.length} task{list.length === 1 ? "" : "s"}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
          Nothing here.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.key}>
              {g.label && (
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  {g.label}{" "}
                  <span className="font-normal">({g.items.length})</span>
                </h3>
              )}
              <ul className="flex flex-col gap-2">
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

function TaskRow({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const uid = useUid();
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);
  const area = selectArea(areas, task.areaId);
  const project = projects.find((p) => p.id === task.projectId);
  const overdue = isOverdue(task.dueDate);
  const dueToday = isToday(task.dueDate);
  const done = task.status === "done";

  return (
    <li
      className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
      style={area ? { borderLeft: `3px solid ${area.color}` } : undefined}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={() => uid && setTaskCompletion(uid, task, !done)}
        className="h-4 w-4 shrink-0"
      />

      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div
          className={`truncate text-sm ${done ? "text-muted line-through" : ""}`}
        >
          <span
            className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: URGENCY_LABELS[task.urgency].color }}
            title={URGENCY_LABELS[task.urgency].label}
          />
          {task.title}
          {task.recurrence && (
            <span className="ml-1.5 text-muted" title="Repeats">
              ↻
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          {project && (
            <span className="rounded bg-line/60 px-1.5 py-0.5 text-muted">
              {project.name}
            </span>
          )}
          {task.dueDate && (
            <span
              className={
                overdue
                  ? "font-medium text-red-600"
                  : dueToday
                    ? "font-medium text-amber-600"
                    : "text-muted"
              }
            >
              {overdue ? "Overdue · " : dueToday ? "Today · " : ""}
              {formatDateLabel(task.dueDate)}
            </span>
          )}
        </div>
      </button>

      {/* Inline area change — quick, no modal needed */}
      <select
        value={task.areaId ?? ""}
        onChange={(e) => {
          if (!uid) return;
          const areaId = e.target.value || undefined;
          updateTask(uid, task.id, {
            areaId,
            // Clear an orphaned project if the area changed away from it.
            projectId:
              project && project.areaId !== areaId ? undefined : task.projectId,
            status: done ? task.status : statusForArea(areaId),
          });
        }}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 rounded-md border border-line bg-canvas px-2 py-1 text-xs outline-none focus:border-ink"
        title="Change area"
        style={area ? { color: area.color } : undefined}
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
