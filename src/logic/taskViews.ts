/**
 * UI-agnostic task filtering & sorting for the smart views.
 */
import type { Task, TaskStatus } from "@/data/types";
import { isOverdue, isToday, todayIso } from "@/lib/dates";

/**
 * A task is "in the inbox" until it has been clarified. The data model defines
 * clarified as: has an area assigned. This single helper keeps that rule in one
 * place so the inbox list and the edit handlers agree.
 */
export function isInbox(task: Task): boolean {
  return task.status !== "done" && !task.areaId;
}

/** The status a task should hold given whether it now has an area. */
export function statusForArea(areaId: string | undefined): TaskStatus {
  return areaId ? "clarified" : "inbox";
}

export type TaskView =
  | "today"
  | "upcoming"
  | "overdue"
  | "nodate"
  | "inbox"
  | "all";

export type TaskSort = "urgency" | "dueDate" | "area";

/** Tasks that are still open (not done) — most views exclude completed. */
function isOpen(t: Task) {
  return t.status !== "done";
}

/** Add N days to an ISO date string. */
function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

export function filterTasks(tasks: Task[], view: TaskView): Task[] {
  const today = todayIso();
  const weekOut = addDaysIso(today, 7);

  switch (view) {
    case "inbox":
      return tasks.filter(isInbox);
    case "today":
      return tasks.filter(
        (t) => isOpen(t) && (isToday(t.dueDate) || t.plannedFor === today),
      );
    case "upcoming":
      return tasks.filter(
        (t) =>
          isOpen(t) && t.dueDate && t.dueDate > today && t.dueDate <= weekOut,
      );
    case "overdue":
      return tasks.filter((t) => isOpen(t) && isOverdue(t.dueDate));
    case "nodate":
      return tasks.filter((t) => isOpen(t) && !t.dueDate && !isInbox(t));
    case "all":
    default:
      return tasks.filter((t) => !isInbox(t));
  }
}

/** Tasks the user has planned for a given ISO date (open ones only). */
export function plannedFor(tasks: Task[], iso: string): Task[] {
  return tasks
    .filter((t) => t.plannedFor === iso && t.status !== "done")
    .sort((a, b) => b.urgency - a.urgency);
}

/**
 * The planning "backlog": actionable tasks (clarified, not done, not in inbox)
 * that aren't yet planned for the given date — candidates to pull into a plan.
 */
export function planningBacklog(tasks: Task[], excludeIso?: string): Task[] {
  return tasks
    .filter(
      (t) =>
        !isInbox(t) && t.status !== "done" && t.plannedFor !== excludeIso,
    )
    .sort((a, b) => b.urgency - a.urgency);
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const copy = [...tasks];
  switch (sort) {
    case "urgency":
      return copy.sort((a, b) => b.urgency - a.urgency);
    case "dueDate":
      return copy.sort((a, b) =>
        (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
      );
    case "area":
      return copy.sort((a, b) =>
        (a.areaId ?? "").localeCompare(b.areaId ?? ""),
      );
    default:
      return copy;
  }
}
