import type { Area, Project, Urgency } from "@/data/types";

export interface ClarifyValues {
  areaId?: string;
  projectId?: string;
  urgency: Urgency;
  dueDate?: string;
}

export const URGENCY_LABELS: Record<Urgency, { label: string; color: string }> = {
  1: { label: "Low", color: "#65a30d" },
  2: { label: "Medium", color: "#d97706" },
  3: { label: "High", color: "#ea580c" },
  4: { label: "Urgent", color: "#dc2626" },
};

/** Shared editing controls for area / project / urgency / due date. */
export function ClarifyFields({
  values,
  onChange,
  areas,
  projects,
}: {
  values: ClarifyValues;
  onChange: (v: ClarifyValues) => void;
  areas: Area[];
  projects: Project[];
}) {
  const areaProjects = projects.filter(
    (p) => p.areaId === values.areaId && !p.archived,
  );

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-muted">Area</span>
        <select
          value={values.areaId ?? ""}
          onChange={(e) =>
            onChange({
              ...values,
              areaId: e.target.value || undefined,
              projectId: undefined,
            })
          }
          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        >
          <option value="">— none —</option>
          {areas
            .filter((a) => !a.archived)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </select>
      </label>

      {values.areaId && areaProjects.length > 0 && (
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-muted">
            Project (optional)
          </span>
          <select
            value={values.projectId ?? ""}
            onChange={(e) =>
              onChange({ ...values, projectId: e.target.value || undefined })
            }
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          >
            <option value="">— none —</option>
            {areaProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="text-sm">
        <span className="mb-1 block text-xs font-medium text-muted">Urgency</span>
        <div className="flex gap-2">
          {([1, 2, 3, 4] as Urgency[]).map((u) => {
            const active = values.urgency === u;
            const { label, color } = URGENCY_LABELS[u];
            return (
              <button
                type="button"
                key={u}
                onClick={() => onChange({ ...values, urgency: u })}
                className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium"
                style={{
                  borderColor: active ? color : "var(--color-line)",
                  backgroundColor: active ? `${color}1a` : "transparent",
                  color: active ? color : "var(--color-muted)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-muted">
          Due date (optional)
        </span>
        <input
          type="date"
          value={values.dueDate ?? ""}
          onChange={(e) =>
            onChange({ ...values, dueDate: e.target.value || undefined })
          }
          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </label>
    </div>
  );
}
