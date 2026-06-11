import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDataStore } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { archiveProject } from "@/data/projects";
import {
  progressOf,
  secondsForArea,
  secondsForProject,
  tasksInArea,
  tasksInProject,
} from "@/logic/projectStats";
import { iconEmoji } from "@/lib/icons";
import { formatDuration, isOverdue, countdownLabel } from "@/lib/dates";
import type { Project } from "@/data/types";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/ProjectForm";
import { URGENCY_LABELS } from "@/components/ClarifyFields";

export function AreaDetailPage() {
  const { areaId = "" } = useParams();
  const uid = useUid();
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);
  const tasks = useDataStore((s) => s.tasks);
  const timeLogs = useDataStore((s) => s.timeLogs);

  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const area = areas.find((a) => a.id === areaId);
  if (!area) {
    return (
      <div className="text-muted">
        Area not found.{" "}
        <Link to="/areas" className="text-ink hover:underline">
          Back to areas
        </Link>
      </div>
    );
  }

  const areaProjects = projects
    .filter((p) => p.areaId === areaId && (showArchived || !p.archived))
    .sort((a, b) => b.priority - a.priority);
  const areaTasks = tasksInArea(tasks, areaId);
  const openTasks = areaTasks.filter((t) => t.status !== "done");
  const totalSeconds = secondsForArea(timeLogs, areaId);

  return (
    <div>
      <Link to="/areas" className="text-sm text-muted hover:text-ink">
        ← Areas
      </Link>

      <header
        className="mt-2 mb-6 card p-5"
        style={{ borderLeft: `5px solid ${area.color}` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {iconEmoji(area.icon)}
          </span>
          <div>
            <h1 className="page-title">{area.name}</h1>
            {area.description && (
              <p className="text-sm text-muted">{area.description}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
          <span>
            <strong className="text-ink">{formatDuration(totalSeconds)}</strong>{" "}
            logged
          </span>
          <span>
            <strong className="text-ink">{areaProjects.length}</strong> projects
          </span>
          <span>
            <strong className="text-ink">{openTasks.length}</strong> open tasks
          </span>
          {area.weeklyTimeGoalHours ? (
            <span>
              Goal <strong className="text-ink">{area.weeklyTimeGoalHours}h</strong>/wk
            </span>
          ) : null}
        </div>
      </header>

      {/* Projects */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="label-caps">Projects</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-muted">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Archived
            </label>
            <Button onClick={() => setCreating(true)} className="px-3 py-1.5">
              + New project
            </Button>
          </div>
        </div>

        {areaProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line2/70 px-6 py-12 text-center text-sm text-muted">
            No projects yet in this area.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {areaProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                color={area.color}
                progress={progressOf(tasksInProject(tasks, project.id))}
                seconds={secondsForProject(timeLogs, project.id)}
                onArchive={() =>
                  uid && archiveProject(uid, project.id, !project.archived)
                }
              />
            ))}
          </ul>
        )}
      </section>

      {/* Open tasks in this area */}
      <section>
        <h2 className="label-caps mb-3">Open tasks</h2>
        {openTasks.length === 0 ? (
          <p className="text-sm text-muted">No open tasks in this area.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {openTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 card px-3 py-2 text-sm"
              >
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: URGENCY_LABELS[t.urgency].color }}
                />
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                {t.projectId && (
                  <span className="text-xs text-muted">
                    {projects.find((p) => p.id === t.projectId)?.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {creating && (
        <ProjectForm areaId={areaId} onClose={() => setCreating(false)} />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  color,
  progress,
  seconds,
  onArchive,
}: {
  project: Project;
  color: string;
  progress: { done: number; total: number; pct: number };
  seconds: number;
  onArchive: () => void;
}) {
  const overdue = project.status !== "done" && isOverdue(project.dueDate);

  return (
    <li
      className="card p-4 transition-shadow duration-200 hover:shadow-lift"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/projects/${project.id}`}
          className="font-medium hover:underline"
        >
          {project.name}
          {project.archived && (
            <span className="ml-2 text-xs text-muted">(archived)</span>
          )}
        </Link>
        <StatusBadge status={project.status} />
      </div>

      {project.dueDate && (
        <div
          className={`mt-1 text-xs ${
            overdue ? "font-medium text-[#b3361b]" : "text-muted"
          }`}
        >
          {countdownLabel(project.dueDate)}
        </div>
      )}

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>
            {progress.done}/{progress.total} tasks
          </span>
          <span>{progress.pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress.pct}%`, backgroundColor: color }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{formatDuration(seconds)} logged</span>
        <button className="hover:text-ink" onClick={onArchive}>
          {project.archived ? "Unarchive" : "Archive"}
        </button>
      </div>
    </li>
  );
}

export function StatusBadge({ status }: { status: Project["status"] }) {
  const map = {
    active: { label: "Active", color: "#059669" },
    "on-hold": { label: "On hold", color: "#d97706" },
    done: { label: "Done", color: "#64748b" },
  } as const;
  const s = map[status];
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${s.color}1a`, color: s.color }}
    >
      {s.label}
    </span>
  );
}
