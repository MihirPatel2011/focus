import type { Area, Project, Urgency } from "@/data/types";

export interface ClarifyValues {
  areaId?: string;
  projectId?: string;
  urgency: Urgency;
  dueDate?: string;
}

export const URGENCY_LABELS: Record<Urgency, { label: string; color: string }> = {
  1: { label: "Low", color: "#7d8a4e" },
  2: { label: "Medium", color: "#b07d2e" },
  3: { label: "High", color: "#c2410c" },
  4: { label: "Urgent", color: "#b3361b" },
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
        <span className="label-caps mb-1.5 block">Area</span>
        <select
          value={values.areaId ?? ""}
          onChange={(e) =>
            onChange({
              ...values,
              areaId: e.target.value || undefined,
              projectId: undefined,
            })
          }
          className="input-base"
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
          <span className="label-caps mb-1.5 block">Project</span>
          <select
            value={values.projectId ?? ""}
            onChange={(e) =>
              onChange({ ...values, projectId: e.target.value || undefined })
            }
            className="input-base"
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
        <span className="label-caps mb-1.5 block">Urgency</span>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-sunken p-1">
          {([1, 2, 3, 4] as Urgency[]).map((u) => {
            const active = values.urgency === u;
            const { label, color } = URGENCY_LABELS[u];
            return (
              <button
                type="button"
                key={u}
                onClick={() => onChange({ ...values, urgency: u })}
                className={`rounded-lg px-1 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  active ? "bg-surface shadow-soft" : "text-muted hover:text-soft"
                }`}
                style={active ? { color } : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="text-sm">
        <span className="label-caps mb-1.5 block">Due date</span>
        <input
          type="date"
          value={values.dueDate ?? ""}
          onChange={(e) =>
            onChange({ ...values, dueDate: e.target.value || undefined })
          }
          className="input-base"
        />
      </label>
    </div>
  );
}
