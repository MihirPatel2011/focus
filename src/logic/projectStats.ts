/**
 * Pure project/area roll-ups — task progress and total time logged.
 * No React, no Firestore; just derives numbers from the in-memory arrays.
 */
import type { Task, TimeLog } from "@/data/types";

export interface Progress {
  total: number;
  done: number;
  /** 0–100, rounded. 0 when there are no tasks. */
  pct: number;
}

/** Completion progress across a set of tasks. */
export function progressOf(tasks: Task[]): Progress {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function tasksInProject(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((t) => t.projectId === projectId);
}

export function tasksInArea(tasks: Task[], areaId: string): Task[] {
  return tasks.filter((t) => t.areaId === areaId);
}

/** Total focused seconds logged against a project. */
export function secondsForProject(logs: TimeLog[], projectId: string): number {
  return logs
    .filter((l) => l.projectId === projectId)
    .reduce((s, l) => s + l.durationSeconds, 0);
}

/** Total focused seconds logged against an area. */
export function secondsForArea(logs: TimeLog[], areaId: string): number {
  return logs
    .filter((l) => l.areaId === areaId)
    .reduce((s, l) => s + l.durationSeconds, 0);
}
