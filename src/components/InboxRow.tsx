import { useEffect, useRef, useState } from "react";
import type { Area, Project, Task, Urgency } from "@/data/types";
import { URGENCY_LABELS } from "@/components/ClarifyFields";

/**
 * A single inbox task with inline editing for title, area, project, urgency and
 * due date. Every change is pushed immediately via `onPatch` (which persists to
 * Firestore). Setting an area is what clarifies the task and removes it from the
 * inbox — handled by the parent through the same patch.
 */
export function InboxRow({
  task,
  areas,
  projects,
  onPatch,
  onDelete,
}: {
  task: Task;
  areas: Area[];
  projects: Project[];
  onPatch: (patch: Partial<Task>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const titleRef = useRef(task.title);

  // Keep the local field in sync if the task changes underneath us (e.g. sync).
  useEffect(() => {
    if (task.title !== titleRef.current) {
      setTitle(task.title);
      titleRef.current = task.title;
    }
  }, [task.title]);

  function commitTitle() {
    const next = title.trim();
    if (next && next !== task.title) {
      titleRef.current = next;
      onPatch({ title: next });
    } else if (!next) {
      setTitle(task.title); // don't allow empty titles
    }
  }

  const liveAreas = areas.filter((a) => !a.archived);
  const areaProjects = projects.filter(
    (p) => p.areaId === task.areaId && !p.archived,
  );

  return (
    <li className="flex flex-col gap-2 card p-3 sm:flex-row sm:items-center">
      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-1 text-sm outline-none focus:bg-canvas"
        aria-label="Task title"
      />

      {/* Inline controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Urgency */}
        <select
          value={task.urgency}
          onChange={(e) =>
            onPatch({ urgency: Number(e.target.value) as Urgency })
          }
          className="select-pill"
          style={{ color: URGENCY_LABELS[task.urgency].color }}
          aria-label="Urgency"
          title="Urgency"
        >
          {([1, 2, 3, 4] as Urgency[]).map((u) => (
            <option key={u} value={u}>
              {URGENCY_LABELS[u].label}
            </option>
          ))}
        </select>

        {/* Due date */}
        <input
          type="date"
          value={task.dueDate ?? ""}
          onChange={(e) =>
            onPatch({ dueDate: e.target.value || undefined })
          }
          className="select-pill"
          aria-label="Due date"
          title="Due date"
        />

        {/* Project (only meaningful once an area is chosen) */}
        {task.areaId && areaProjects.length > 0 && (
          <select
            value={task.projectId ?? ""}
            onChange={(e) =>
              onPatch({ projectId: e.target.value || undefined })
            }
            className="select-pill"
            aria-label="Project"
            title="Project"
          >
            <option value="">No project</option>
            {areaProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {/* Area — assigning one clarifies the task and removes it from inbox */}
        <select
          value={task.areaId ?? ""}
          onChange={(e) =>
            onPatch({
              areaId: e.target.value || undefined,
              // Clearing the area also clears the (now-orphaned) project.
              projectId: e.target.value ? task.projectId : undefined,
            })
          }
          className="select-pill"
          aria-label="Area"
          title="Assign an area to clarify this task"
        >
          <option value="">Assign area…</option>
          {liveAreas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <button
          onClick={onDelete}
          className="rounded-md px-2 py-1 text-xs text-muted hover:text-[#b3361b]"
          aria-label="Delete task"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
