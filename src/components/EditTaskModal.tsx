import { useState } from "react";
import { useDataStore } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { deleteTask, updateTask } from "@/data/tasks";
import { statusForArea } from "@/logic/taskViews";
import { addDaysIso, todayIso } from "@/lib/dates";
import type { ChecklistItem, Task } from "@/data/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ClarifyFields, type ClarifyValues } from "@/components/ClarifyFields";
import { RecurrenceEditor } from "@/components/RecurrenceEditor";

/**
 * Full task editor (title, notes, checklist, area, project, urgency, due date,
 * estimate, recurrence). Reads areas/projects from the store so any caller
 * just passes the task.
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
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task.checklist ?? [],
  );
  const [newStep, setNewStep] = useState("");
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

  function addStep() {
    const t = newStep.trim();
    if (!t) return;
    setChecklist((c) => [
      ...c,
      { id: crypto.randomUUID(), title: t, done: false },
    ]);
    setNewStep("");
  }

  async function save() {
    if (!uid) return;
    await updateTask(uid, task.id, {
      title: title.trim() || task.title,
      notes: notes.trim() || undefined,
      checklist: checklist.length ? checklist : undefined,
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

  const today = todayIso();
  const quickDates: { label: string; iso: string }[] = [
    { label: "Today", iso: today },
    { label: "Tomorrow", iso: addDaysIso(today, 1) },
    { label: "Next week", iso: addDaysIso(today, 7) },
  ];

  return (
    <Modal open onClose={onClose} title="Edit task">
      <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto px-0.5 sm:max-h-[65vh]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-base"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes (optional)"
          className="input-base"
        />

        {/* Checklist — small steps inside the task. */}
        <div className="text-sm">
          <span className="label-caps mb-1.5 block">Checklist</span>
          {checklist.length > 0 && (
            <ul className="mb-2 flex flex-col gap-1">
              {checklist.map((item) => (
                <li key={item.id} className="group flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      setChecklist((c) =>
                        c.map((i) =>
                          i.id === item.id ? { ...i, done: !i.done } : i,
                        ),
                      )
                    }
                    className="!h-4 !w-4"
                  />
                  <span
                    className={`min-w-0 flex-1 truncate ${
                      item.done ? "text-muted line-through" : ""
                    }`}
                  >
                    {item.title}
                  </span>
                  <button
                    onClick={() =>
                      setChecklist((c) => c.filter((i) => i.id !== item.id))
                    }
                    className="text-muted opacity-60 transition-opacity hover:text-[#b3361b] sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Remove step: ${item.title}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStep();
                }
              }}
              placeholder="Add a step…"
              className="input-base"
            />
            <Button
              type="button"
              variant="subtle"
              onClick={addStep}
              disabled={!newStep.trim()}
              className="shrink-0"
            >
              Add
            </Button>
          </div>
        </div>

        <ClarifyFields
          values={values}
          onChange={setValues}
          areas={areas}
          projects={projects}
        />

        {/* Quick dates */}
        <div className="-mt-2 flex gap-1.5">
          {quickDates.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() =>
                setValues((v) => ({
                  ...v,
                  dueDate: v.dueDate === q.iso ? undefined : q.iso,
                }))
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                values.dueDate === q.iso
                  ? "bg-ink text-canvas"
                  : "bg-ink/[0.05] text-soft hover:bg-ink/10"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>

        <label className="text-sm">
          <span className="label-caps mb-1.5 block">
            Estimate (minutes, optional)
          </span>
          <input
            type="number"
            min="0"
            step="5"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="e.g. 30"
            className="input-base"
          />
        </label>
        <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-4">
        <button
          className="text-sm text-muted hover:text-[#b3361b]"
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
    </Modal>
  );
}
