import { useDataStore } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { deleteTask, updateTask } from "@/data/tasks";
import { isInbox, statusForArea } from "@/logic/taskViews";
import type { Task } from "@/data/types";
import { InboxRow } from "@/components/InboxRow";

/**
 * Flat, Todoist-style inbox: every unclarified task in one scannable list, each
 * row editable inline. A task leaves the inbox the moment it gets an area
 * (status flips to "clarified"). No step-through wizard.
 */
export function InboxPage() {
  const uid = useUid();
  const tasks = useDataStore((s) => s.tasks);
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);

  // Sorted oldest-first so you process in the order you captured.
  const inbox = tasks.filter(isInbox).sort((a, b) => a.createdAt - b.createdAt);

  function patch(task: Task, p: Partial<Task>) {
    if (!uid) return;
    // If this patch changes the area, keep status in sync with the inbox rule.
    const next: Partial<Task> =
      "areaId" in p ? { ...p, status: statusForArea(p.areaId) } : p;
    void updateTask(uid, task.id, next);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="page-title">Inbox</h1>
        <p className="text-sm text-muted">
          {inbox.length > 0
            ? `${inbox.length} task${inbox.length === 1 ? "" : "s"} to clarify — assign an area to file each one.`
            : "Nothing to process."}
        </p>
      </header>

      {inbox.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line2/70 px-6 py-14 text-center text-sm text-muted">
          🎉 Inbox zero. Capture something with “+ Quick add” or the{" "}
          <kbd className="kbd">n</kbd> key.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {inbox.map((task) => (
            <InboxRow
              key={task.id}
              task={task}
              areas={areas}
              projects={projects}
              onPatch={(p) => patch(task, p)}
              onDelete={() => uid && deleteTask(uid, task.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
