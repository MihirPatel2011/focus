/**
 * Recurrence logic — pure and framework-agnostic.
 *
 * Computes the next due date for a recurring task and builds the data for the
 * next instance when a recurring task is completed. No React, no Firestore.
 */
import type { NewTask, Recurrence, Task } from "@/data/types";
import { addDaysIso, parseIso, todayIso } from "@/lib/dates";

/** Add `n` months to an ISO date, clamping the day to the target month. */
function addMonthsIso(iso: string, n: number): string {
  const d = parseIso(iso);
  const targetMonthFirst = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const daysInTarget = new Date(
    targetMonthFirst.getFullYear(),
    targetMonthFirst.getMonth() + 1,
    0,
  ).getDate();
  const day = Math.min(d.getDate(), daysInTarget);
  return todayIso(
    new Date(targetMonthFirst.getFullYear(), targetMonthFirst.getMonth(), day),
  );
}

/**
 * The next due date strictly after `fromIso` for a recurrence.
 * - daily:   + interval days
 * - weekly:  next selected weekday (daysOfWeek); else + interval weeks.
 *            With interval > 1 and selected days, jumps the extra weeks.
 * - monthly: + interval months (day clamped)
 */
export function nextDueDate(rec: Recurrence, fromIso: string): string {
  const interval = Math.max(1, rec.interval || 1);

  switch (rec.frequency) {
    case "daily":
      return addDaysIso(fromIso, interval);

    case "weekly": {
      const days = rec.daysOfWeek?.length
        ? [...rec.daysOfWeek].sort((a, b) => a - b)
        : null;
      if (!days) return addDaysIso(fromIso, 7 * interval);
      // Find the next selected weekday within the coming week.
      for (let i = 1; i <= 7; i++) {
        const cand = addDaysIso(fromIso, i);
        if (days.includes(parseIso(cand).getDay())) {
          // If repeating every N>1 weeks, skip the extra weeks once.
          return interval > 1 ? addDaysIso(cand, (interval - 1) * 7) : cand;
        }
      }
      return addDaysIso(fromIso, 7 * interval);
    }

    case "monthly":
      return addMonthsIso(fromIso, interval);
  }
}

/**
 * Build the next instance of a completed recurring task. Returns null if the
 * task isn't recurring. The new instance copies the task's defining fields,
 * advances the due date, and is unplanned (no plannedFor).
 */
export function buildNextInstance(task: Task): NewTask | null {
  if (!task.recurrence) return null;

  // Advance from the current due date, or today if the task had none.
  const base = task.dueDate ?? task.recurrence.nextDueDate ?? todayIso();
  const due = nextDueDate(task.recurrence, base);

  return {
    title: task.title,
    notes: task.notes,
    urgency: task.urgency,
    areaId: task.areaId,
    projectId: task.projectId,
    estimateMinutes: task.estimateMinutes,
    dueDate: due,
    recurrence: { ...task.recurrence, nextDueDate: due },
    // A freshly generated instance is actionable if it already has an area.
    status: task.areaId ? "clarified" : "inbox",
  };
}
