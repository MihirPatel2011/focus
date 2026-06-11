import { useMemo, useState } from "react";
import { useDataStore, selectArea } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { deleteTask, updateTask } from "@/data/tasks";
import { setTaskCompletion } from "@/logic/taskActions";
import {
  filterTasks,
  sortTasks,
  type TaskSort,
  type TaskView,
} from "@/logic/taskViews";
import type { Task } from "@/data/types";
import { isOverdue, isToday, formatDateLabel } from "@/lib/dates";
import { AreaBadge } from "@/components/AreaBadge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  ClarifyFields,
  URGENCY_LABELS,
  type ClarifyValues,
} from "@/components/ClarifyFields";
import { RecurrenceEditor } from "@/components/RecurrenceEditor";

const VIEWS: { key: TaskView; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "nodate", label: "No date" },
  { key: "all", label: "All" },
];

export function TasksPage() {
  const uid = useUid();
  const tasks = useDataStore((s) => s.tasks);
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);

  const [view, setView] = useState<TaskView>("today");
  const [sort, setSort] = useState<TaskSort>("urgency");
  const [editing, setEditing] = useState<Task | null>(null);

  const list = useMemo(
    () => sortTasks(filterTasks(tasks, view), sort),
    [tasks, view, sort],
  );

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted">Smart views across your tasks.</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as TaskSort)}
          className="ml-auto rounded-lg border border-line bg-surface px-2 py-1 text-sm"
        >
          <option value="urgency">Sort: Urgency</option>
          <option value="dueDate">Sort: Due date</option>
          <option value="area">Sort: Area</option>
        </select>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
          Nothing here.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              area={selectArea(areas, task.areaId)}
              onToggle={() =>
                uid && setTaskCompletion(uid, task, task.status !== "done")
              }
              onEdit={() => setEditing(task)}
            />
          ))}
        </ul>
      )}

      {editing && (
        <EditTaskModal
          task={editing}
          areas={areas}
          projects={projects}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function TaskRow({
  task,
  area,
  onToggle,
  onEdit,
}: {
  task: Task;
  area: ReturnType<typeof selectArea>;
  onToggle: () => void;
  onEdit: () => void;
}) {
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
        onChange={onToggle}
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
            <span className="ml-1.5 text-muted" title="Recurring task">
              ↻
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {area && <AreaBadge area={area} />}
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
    </li>
  );
}

function EditTaskModal({
  task,
  areas,
  projects,
  onClose,
}: {
  task: Task;
  areas: ReturnType<typeof useDataStore.getState>["areas"];
  projects: ReturnType<typeof useDataStore.getState>["projects"];
  onClose: () => void;
}) {
  const uid = useUid();
  const [title, setTitle] = useState(task.title);
  const [values, setValues] = useState<ClarifyValues>({
    areaId: task.areaId,
    projectId: task.projectId,
    urgency: task.urgency,
    dueDate: task.dueDate,
  });
  const [recurrence, setRecurrence] = useState(task.recurrence);

  async function save() {
    if (!uid) return;
    await updateTask(uid, task.id, {
      title: title.trim() || task.title,
      areaId: values.areaId,
      projectId: values.projectId,
      urgency: values.urgency,
      dueDate: values.dueDate,
      recurrence,
      // Promote inbox tasks to clarified once they have an area.
      status:
        task.status === "inbox" && values.areaId ? "clarified" : task.status,
    });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Edit task">
      <div className="flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <ClarifyFields
          values={values}
          onChange={setValues}
          areas={areas}
          projects={projects}
        />
        <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
        <div className="flex items-center justify-between">
          <button
            className="text-sm text-muted hover:text-red-600"
            onClick={() => {
              if (uid) deleteTask(uid, task.id);
              onClose();
            }}
          >
            Delete
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
