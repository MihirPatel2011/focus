import { useState } from "react";
import type { Project, ProjectStatus } from "@/data/types";
import { createProject, updateProject } from "@/data/projects";
import { useUid } from "@/logic/useCurrentUser";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On hold" },
  { value: "done", label: "Done" },
];

/**
 * Create or edit a Project. When `project` is provided it edits; otherwise it
 * creates within `areaId`. Pure UI over the projects data layer.
 */
export function ProjectForm({
  areaId,
  project,
  onClose,
}: {
  areaId: string;
  project?: Project;
  onClose: () => void;
}) {
  const uid = useUid();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "active",
  );
  const [priority, setPriority] = useState(project?.priority ?? 2);
  const [dueDate, setDueDate] = useState(project?.dueDate ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !name.trim()) return;
    setSaving(true);
    try {
      if (project) {
        await updateProject(uid, project.id, {
          name: name.trim(),
          description: description.trim(),
          status,
          priority,
          dueDate: dueDate || undefined,
        });
      } else {
        await createProject(uid, {
          name: name.trim(),
          areaId,
          description: description.trim(),
          status,
          priority,
          dueDate: dueDate || undefined,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={project ? "Edit project" : "New project"}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description (optional)"
          className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">
              Priority
            </span>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
              <option value={4}>Urgent</option>
            </select>
          </label>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-muted">
            Due date (optional)
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {project ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
