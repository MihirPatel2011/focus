import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDataStore } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { archiveProject } from "@/data/projects";
import { createTask } from "@/data/tasks";
import { setTaskCompletion } from "@/logic/taskActions";
import {
  progressOf,
  secondsForProject,
  tasksInProject,
} from "@/logic/projectStats";
import { formatDuration, isOverdue, countdownLabel } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/ProjectForm";
import { StatusBadge } from "@/pages/AreaDetailPage";
import { URGENCY_LABELS } from "@/components/ClarifyFields";

export function ProjectDetailPage() {
  const { projectId = "" } = useParams();
  const uid = useUid();
  const navigate = useNavigate();
  const projects = useDataStore((s) => s.projects);
  const areas = useDataStore((s) => s.areas);
  const tasks = useDataStore((s) => s.tasks);
  const timeLogs = useDataStore((s) => s.timeLogs);

  const [editing, setEditing] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <div className="text-muted">
        Project not found.{" "}
        <Link to="/areas" className="text-ink hover:underline">
          Back to areas
        </Link>
      </div>
    );
  }

  const area = areas.find((a) => a.id === project.areaId);
  const color = area?.color ?? "#2563eb";
  const projectTasks = tasksInProject(tasks, projectId);
  const open = projectTasks.filter((t) => t.status !== "done");
  const done = projectTasks.filter((t) => t.status === "done");
  const progress = progressOf(projectTasks);
  const seconds = secondsForProject(timeLogs, projectId);
  const overdue = project.status !== "done" && isOverdue(project.dueDate);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!uid || !title) return;
    await createTask(uid, {
      title,
      areaId: project!.areaId,
      projectId: project!.id,
      status: "clarified",
    });
    setNewTitle("");
  }

  return (
    <div>
      <Link
        to={`/areas/${project.areaId}`}
        className="text-sm text-muted hover:text-ink"
      >
        ← {area?.name ?? "Area"}
      </Link>

      <header
        className="mt-2 mb-6 rounded-2xl border border-line bg-surface p-5"
        style={{ borderLeft: `5px solid ${color}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="mt-1 text-sm text-muted">{project.description}</p>
            )}
            {project.dueDate && (
              <p
                className={`mt-1 text-sm ${
                  overdue ? "font-medium text-red-600" : "text-muted"
                }`}
              >
                Due {project.dueDate} · {countdownLabel(project.dueDate)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="subtle" onClick={() => setEditing(true)} className="px-3 py-1.5">
              Edit
            </Button>
            <Button
              variant="ghost"
              className="px-3 py-1.5"
              onClick={async () => {
                if (!uid) return;
                await archiveProject(uid, project.id, !project.archived);
                if (!project.archived) navigate(`/areas/${project.areaId}`);
              }}
            >
              {project.archived ? "Unarchive" : "Archive"}
            </Button>
          </div>
        </div>

        {/* Progress + time */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>
                {progress.done}/{progress.total} tasks done
              </span>
              <span>{progress.pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{ width: `${progress.pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-xs text-muted">Total time logged</div>
            <div className="font-semibold tabular-nums">
              {formatDuration(seconds)}
            </div>
          </div>
        </div>
      </header>

      {/* Add task */}
      <form onSubmit={addTask} className="mb-4 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task to this project…"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <Button type="submit" disabled={!newTitle.trim()}>
          Add
        </Button>
      </form>

      {/* Tasks */}
      {projectTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          No tasks in this project yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {[...open, ...done].map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={t.status === "done"}
                onChange={() =>
                  uid && setTaskCompletion(uid, t, t.status !== "done")
                }
                className="h-4 w-4 shrink-0"
              />
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: URGENCY_LABELS[t.urgency].color }}
              />
              <span
                className={`min-w-0 flex-1 truncate ${
                  t.status === "done" ? "text-muted line-through" : ""
                }`}
              >
                {t.title}
              </span>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProjectForm
          areaId={project.areaId}
          project={project}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
