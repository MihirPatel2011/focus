import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDataStore } from "@/logic/stores/dataStore";
import {
  progressOf,
  secondsForProject,
  tasksInProject,
} from "@/logic/projectStats";
import { iconEmoji } from "@/lib/icons";
import { formatDuration, isOverdue, countdownLabel } from "@/lib/dates";
import type { Project } from "@/data/types";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/ProjectForm";
import { StatusBadge } from "@/pages/AreaDetailPage";

/**
 * Top-level Projects hub: every project across all areas, grouped by area.
 * Projects whose area is archived or was deleted are still shown (grouped under
 * a fallback) so nothing ever gets hidden.
 */
export function ProjectsPage() {
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);
  const tasks = useDataStore((s) => s.tasks);
  const timeLogs = useDataStore((s) => s.timeLogs);

  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const hasArea = areas.some((a) => !a.archived);

  // Group every visible project by its areaId (resolving the area, which may be
  // archived or missing). Built from the projects themselves so orphans show.
  const groups = useMemo(() => {
    const areaById = new Map(areas.map((a) => [a.id, a]));
    const visible = projects.filter((p) => showArchived || !p.archived);
    const byArea = new Map<string, Project[]>();
    for (const p of visible) {
      const arr = byArea.get(p.areaId);
      if (arr) arr.push(p);
      else byArea.set(p.areaId, [p]);
    }
    return [...byArea.entries()]
      .map(([areaId, items]) => {
        const area = areaById.get(areaId);
        return {
          areaId,
          area,
          label: area
            ? area.name + (area.archived ? " (archived)" : "")
            : "Area removed",
          color: area?.color ?? "#94a3b8",
          icon: area ? iconEmoji(area.icon) : "❓",
          items: items.sort((a, b) => b.priority - a.priority),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [areas, projects, showArchived]);

  return (
    <div>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-muted">
            Projects live inside an area and hold tasks.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={!hasArea}>
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

      {!hasArea ? (
        <div className="rounded-2xl border border-dashed border-line2/70 px-6 py-14 text-center text-sm text-muted">
          Create an{" "}
          <Link to="/areas" className="text-ink hover:underline">
            area
          </Link>{" "}
          first, then add projects to it.
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line2/70 px-6 py-14 text-center text-sm text-muted">
          No projects yet. Click “+ New project” to add one.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.areaId}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden>{g.icon}</span>
                <span style={{ color: g.color }}>{g.label}</span>
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {g.items.map((project) => {
                  const progress = progressOf(tasksInProject(tasks, project.id));
                  const secs = secondsForProject(timeLogs, project.id);
                  const overdue =
                    project.status !== "done" && isOverdue(project.dueDate);
                  return (
                    <li
                      key={project.id}
                      className="card p-4 transition-shadow duration-200 hover:shadow-lift"
                      style={{ borderTop: `3px solid ${g.color}` }}
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
                          className={`mt-1 text-xs ${overdue ? "font-medium text-[#b3361b]" : "text-muted"}`}
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
                              backgroundColor: g.color,
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
          ))}
        </div>
      )}

      {creating && <ProjectForm areaId="" onClose={() => setCreating(false)} />}
    </div>
  );
}
