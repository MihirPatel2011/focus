import { useState } from "react";
import { Link } from "react-router-dom";
import { useDataStore } from "@/logic/stores/dataStore";
import { useUid } from "@/logic/useCurrentUser";
import { archiveArea, createArea, updateArea } from "@/data/areas";
import type { Area } from "@/data/types";
import { AREA_COLORS, AREA_ICONS, iconEmoji } from "@/lib/icons";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function AreasPage() {
  const uid = useUid();
  const areas = useDataStore((s) => s.areas);
  const timeLogs = useDataStore((s) => s.timeLogs);
  const [editing, setEditing] = useState<Area | "new" | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const visible = areas.filter((a) => showArchived || !a.archived);

  // Total focused seconds per area (all-time) for a quick "time spent" readout.
  const secondsByArea = new Map<string, number>();
  for (const log of timeLogs) {
    secondsByArea.set(
      log.areaId,
      (secondsByArea.get(log.areaId) ?? 0) + log.durationSeconds,
    );
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Areas</h1>
          <p className="text-sm text-muted">
            Your life focuses — color-coded across the whole app.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>+ New area</Button>
      </header>

      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        Show archived
      </label>

      {visible.length === 0 ? (
        <Empty onCreate={() => setEditing("new")} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((area) => {
            const hrs = ((secondsByArea.get(area.id) ?? 0) / 3600).toFixed(1);
            return (
              <li
                key={area.id}
                className="rounded-xl border border-line bg-surface p-4"
                style={{ borderLeft: `4px solid ${area.color}` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden>
                      {iconEmoji(area.icon)}
                    </span>
                    <div>
                      <div className="font-medium">
                        <Link
                          to={`/areas/${area.id}`}
                          className="hover:underline"
                        >
                          {area.name}
                        </Link>
                        {area.archived && (
                          <span className="ml-2 text-xs text-muted">
                            (archived)
                          </span>
                        )}
                      </div>
                      {area.description && (
                        <div className="text-xs text-muted">
                          {area.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>
                    {hrs} h logged
                    {area.weeklyTimeGoalHours
                      ? ` · goal ${area.weeklyTimeGoalHours} h/wk`
                      : ""}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="hover:text-ink"
                      onClick={() => setEditing(area)}
                    >
                      Edit
                    </button>
                    <button
                      className="hover:text-ink"
                      onClick={() =>
                        uid && archiveArea(uid, area.id, !area.archived)
                      }
                    >
                      {area.archived ? "Unarchive" : "Archive"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <AreaForm
          area={editing === "new" ? undefined : editing}
          existingCount={areas.length}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-10 text-center">
      <p className="text-muted">No areas yet.</p>
      <Button className="mt-3" onClick={onCreate}>
        Create your first area
      </Button>
    </div>
  );
}

function AreaForm({
  area,
  existingCount,
  onClose,
}: {
  area?: Area;
  existingCount: number;
  onClose: () => void;
}) {
  const uid = useUid();
  const [name, setName] = useState(area?.name ?? "");
  const [description, setDescription] = useState(area?.description ?? "");
  const [color, setColor] = useState(area?.color ?? AREA_COLORS[0]);
  const [icon, setIcon] = useState(area?.icon ?? AREA_ICONS[0].key);
  const [goal, setGoal] = useState(
    area?.weeklyTimeGoalHours != null ? String(area.weeklyTimeGoalHours) : "",
  );
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !name.trim()) return;
    setSaving(true);
    const goalHours = goal.trim() ? Number(goal) : undefined;
    try {
      if (area) {
        await updateArea(uid, area.id, {
          name: name.trim(),
          description: description.trim(),
          color,
          icon,
          weeklyTimeGoalHours: goalHours,
        });
      } else {
        await createArea(uid, {
          name: name.trim(),
          description: description.trim(),
          color,
          icon,
          weeklyTimeGoalHours: goalHours,
          order: existingCount,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={area ? "Edit area" : "New area"}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Area name (e.g. Business)"
          className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
        />

        <div>
          <div className="mb-1 text-xs font-medium text-muted">Color</div>
          <div className="flex flex-wrap gap-2">
            {AREA_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full ring-offset-2 ${
                  color === c ? "ring-2 ring-ink" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={`color ${c}`}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-muted">Icon</div>
          <div className="flex flex-wrap gap-1">
            {AREA_ICONS.map((i) => (
              <button
                type="button"
                key={i.key}
                onClick={() => setIcon(i.key)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                  icon === i.key ? "bg-line ring-2 ring-ink" : "hover:bg-line/50"
                }`}
                title={i.label}
              >
                {i.emoji}
              </button>
            ))}
          </div>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-muted">
            Weekly time goal (hours, optional)
          </span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. 10"
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {area ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
