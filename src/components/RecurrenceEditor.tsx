import type { Recurrence, RecurrenceFrequency } from "@/data/types";

const FREQS: { value: RecurrenceFrequency; unit: string }[] = [
  { value: "daily", unit: "day(s)" },
  { value: "weekly", unit: "week(s)" },
  { value: "monthly", unit: "month(s)" },
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
    <div className="rounded-xl bg-sunken/70 p-3.5">
      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
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
        Repeats <span aria-hidden className="text-muted">↻</span>
      </label>

      {enabled && value && (
        <div className="animate-rise mt-3.5 flex flex-col gap-3.5">
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
              className="input-base w-18 text-center"
            />
            <select
              value={value.frequency}
              onChange={(e) =>
                onChange({
                  ...value,
                  frequency: e.target.value as RecurrenceFrequency,
                })
              }
              className="input-base w-auto"
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
              <div className="label-caps mb-1.5">On days</div>
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
                      className={`h-9 w-9 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        active
                          ? "bg-ink text-canvas shadow-soft"
                          : "bg-surface text-muted hover:text-ink"
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
            Completing this task creates the next one automatically.
          </p>
        </div>
      )}
    </div>
  );
}
