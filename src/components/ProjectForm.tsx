import { useState } from "react";
import type { Project, ProjectStatus } from "@/data/types";
import { createProject, updateProject } from "@/data/projects";
import { useDataStore } from "@/logic/stores/dataStore";
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
  /** Preselected area. Pass "" to let the user choose (e.g. global Projects page). */
  areaId: string;
  project?: Project;
  onClose: () => void;
}) {
  const uid = useUid();
  const liveAreas = useDataStore((s) => s.areas).filter((a) => !a.archived);
  const [area, setArea] = useState(project?.areaId ?? areaId ?? "");
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
    if (!uid || !name.trim() || !area) return;
    setSaving(true);
    try {
      if (project) {
        await updateProject(uid, project.id, {
          name: name.trim(),
          areaId: area,
          description: description.trim(),
          status,
          priority,
          dueDate: dueDate || undefined,
        });
      } else {
        await createProject(uid, {
          name: name.trim(),
          areaId: area,
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
          className="input-base"
        />
        <label className="text-sm">
          <span className="label-caps mb-1.5 block">Area</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="input-base"
          >
            <option value="">— choose an area —</option>
            {liveAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description (optional)"
          className="input-base"
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="label-caps mb-1.5 block">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="input-base"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="label-caps mb-1.5 block">
              Priority
            </span>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="input-base"
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
              <option value={4}>Urgent</option>
            </select>
          </label>
        </div>

        <label className="text-sm">
          <span className="label-caps mb-1.5 block">
            Due date (optional)
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input-base"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim() || !area}>
            {project ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
