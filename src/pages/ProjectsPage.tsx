import { useState } from "react";
import { Link } from "react-router-dom";
import { useDataStore } from "@/logic/stores/dataStore";
import {
  progressOf,
  secondsForProject,
  tasksInProject,
} from "@/logic/projectStats";
import { iconEmoji } from "@/lib/icons";
import { formatDuration, isOverdue, countdownLabel } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/ProjectForm";
import { StatusBadge } from "@/pages/AreaDetailPage";

/**
 * Top-level Projects hub: every project across all areas, grouped by area.
 * A project belongs to one area and holds tasks (which also appear in Tasks /
 * Home). Click any project to open its detail view.
 */
export function ProjectsPage() {
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);
  const tasks = useDataStore((s) => s.tasks);
  const timeLogs = useDataStore((s) => s.timeLogs);

  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const liveAreas = areas.filter((a) => !a.archived);
  const visible = projects.filter((p) => showArchived || !p.archived);

  return (
    <div>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted">
            Projects live inside an area and hold tasks.
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          disabled={liveAreas.length === 0}
        >
          + New project
        </Button>
      </header>

      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        Show archived
      </label>

      {liveAreas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
          Create an <Link to="/areas" className="text-ink hover:underline">area</Link>{" "}
          first, then add projects to it.
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
          No projects yet.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {liveAreas.map((area) => {
            const areaProjects = visible
              .filter((p) => p.areaId === area.id)
              .sort((a, b) => b.priority - a.priority);
            if (areaProjects.length === 0) return null;
            return (
              <section key={area.id}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <span aria-hidden>{iconEmoji(area.icon)}</span>
                  <span style={{ color: area.color }}>{area.name}</span>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {areaProjects.map((project) => {
                    const progress = progressOf(
                      tasksInProject(tasks, project.id),
                    );
                    const secs = secondsForProject(timeLogs, project.id);
                    const overdue =
                      project.status !== "done" && isOverdue(project.dueDate);
                    return (
                      <li
                        key={project.id}
                        className="rounded-xl border border-line bg-surface p-4"
                        style={{ borderTop: `3px solid ${area.color}` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/projects/${project.id}`}
                            className="font-medium hover:underline"
                          >
                            {project.name}
                            {project.archived && (
                              <span className="ml-2 text-xs text-muted">
                                (archived)
                              </span>
                            )}
                          </Link>
                          <StatusBadge status={project.status} />
                        </div>
                        {project.dueDate && (
                          <div
                            className={`mt-1 text-xs ${overdue ? "font-medium text-red-600" : "text-muted"}`}
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
                              style={{
                                width: `${progress.pct}%`,
                                backgroundColor: area.color,
                              }}
                            />
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-muted">
                          {formatDuration(secs)} logged
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {creating && <ProjectForm areaId="" onClose={() => setCreating(false)} />}
    </div>
  );
}
