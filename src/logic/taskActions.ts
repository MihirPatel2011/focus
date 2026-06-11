/**
 * Task completion as a single business operation.
 *
 * Centralizes the rule "completing a recurring task spawns its next instance",
 * so every place that completes a task (task list, planning, project detail,
 * focus timer) behaves identically. Pure orchestration over the data layer.
 */
import type { Task } from "@/data/types";
import { createTask, setTaskDone } from "@/data/tasks";
import { buildNextInstance } from "./recurrence";

/**
 * Mark a task done or reopen it. When completing a recurring task, the next
 * instance is generated with the advanced due date.
 */
export async function setTaskCompletion(
  uid: string,
  task: Task,
  done: boolean,
): Promise<void> {
  await setTaskDone(uid, task.id, done);
  if (done && task.recurrence) {
    const next = buildNextInstance(task);
    if (next) await createTask(uid, next);
  }
}
