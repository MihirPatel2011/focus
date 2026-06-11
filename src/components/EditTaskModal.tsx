import { useState } from "react";
import { useDataStore } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { deleteTask, updateTask } from "@/data/tasks";
import { statusForArea } from "@/logic/taskViews";
import type { Task } from "@/data/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ClarifyFields, type ClarifyValues } from "@/components/ClarifyFields";
import { RecurrenceEditor } from "@/components/RecurrenceEditor";

/**
 * Full task editor (title, area, project, urgency, due date, recurrence).
 * Reads areas/projects from the store so any caller just passes the task.
 */
export function EditTaskModal({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const uid = useUid();
  const areas = useDataStore((s) => s.areas);
  const projects = useDataStore((s) => s.projects);

  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [values, setValues] = useState<ClarifyValues>({
    areaId: task.areaId,
    projectId: task.projectId,
    urgency: task.urgency,
    dueDate: task.dueDate,
  });
  const [estimate, setEstimate] = useState(
    task.estimateMinutes != null ? String(task.estimateMinutes) : "",
  );
  const [recurrence, setRecurrence] = useState(task.recurrence);

  async function save() {
    if (!uid) return;
    await updateTask(uid, task.id, {
      title: title.trim() || task.title,
      notes: notes.trim() || undefined,
      areaId: values.areaId,
      projectId: values.projectId,
      urgency: values.urgency,
      dueDate: values.dueDate,
      estimateMinutes: estimate.trim() ? Number(estimate) : undefined,
      recurrence,
      // Keep status in sync with the inbox rule when an area is set/cleared.
      status:
        task.status === "inbox" || task.status === "done"
          ? task.status
          : statusForArea(values.areaId),
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
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes (optional)"
          className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <ClarifyFields
          values={values}
          onChange={setValues}
          areas={areas}
          projects={projects}
        />
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-muted">
            Estimate (minutes, optional)
          </span>
          <input
            type="number"
            min="0"
            step="5"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="e.g. 30"
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>
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
