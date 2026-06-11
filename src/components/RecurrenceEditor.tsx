import type { Recurrence, RecurrenceFrequency } from "@/data/types";

const FREQS: { value: RecurrenceFrequency; label: string; unit: string }[] = [
  { value: "daily", label: "Daily", unit: "day(s)" },
  { value: "weekly", label: "Weekly", unit: "week(s)" },
  { value: "monthly", label: "Monthly", unit: "month(s)" },
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]; // index = getDay()

/**
 * Editor for a task's recurrence rule. `value === undefined` means "does not
 * repeat". Toggling on seeds a sensible default; the parent persists on save.
 */
export function RecurrenceEditor({
  value,
  onChange,
}: {
  value?: Recurrence;
  onChange: (rec: Recurrence | undefined) => void;
}) {
  const enabled = Boolean(value);

  return (
    <div className="rounded-lg border border-line p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) =>
            onChange(
              e.target.checked
                ? { frequency: "weekly", interval: 1, daysOfWeek: [] }
                : undefined,
            )
          }
        />
        Repeats
        <span aria-hidden className="text-muted">
          ↻
        </span>
      </label>

      {enabled && value && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Every</span>
            <input
              type="number"
              min={1}
              value={value.interval}
              onChange={(e) =>
                onChange({
                  ...value,
                  interval: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-16 rounded-md border border-line bg-canvas px-2 py-1 outline-none focus:border-ink"
            />
            <select
              value={value.frequency}
              onChange={(e) =>
                onChange({
                  ...value,
                  frequency: e.target.value as RecurrenceFrequency,
                })
              }
              className="rounded-md border border-line bg-canvas px-2 py-1 outline-none focus:border-ink"
            >
              {FREQS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.unit}
                </option>
              ))}
            </select>
          </div>

          {value.frequency === "weekly" && (
            <div>
              <div className="mb-1 text-xs text-muted">On days (optional)</div>
              <div className="flex gap-1">
                {WEEKDAYS.map((d, i) => {
                  const active = value.daysOfWeek?.includes(i);
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => {
                        const cur = value.daysOfWeek ?? [];
                        onChange({
                          ...value,
                          daysOfWeek: active
                            ? cur.filter((x) => x !== i)
                            : [...cur, i].sort((a, b) => a - b),
                        });
                      }}
                      className={`h-8 w-8 rounded-md text-xs font-medium ${
                        active
                          ? "bg-ink text-white"
                          : "bg-line/50 text-muted hover:bg-line"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <p className="text-xs text-muted">
            Completing this task will create the next one automatically.
          </p>
        </div>
      )}
    </div>
  );
}
