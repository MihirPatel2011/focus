/**
 * Data access for Tasks. Pure Firestore I/O — no React, no UI.
 *
 * Note: recurrence *generation* (creating the next instance on completion) is
 * business logic and lives in src/logic, not here. This file only reads/writes.
 */
import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import type { NewTask, SnapMeta, Task } from "./types";
import { userCollection, userDoc } from "./paths";
import { sanitizeUpdate } from "./sanitize";

function toTask(id: string, data: Record<string, unknown>): Task {
  return { id, ...(data as Omit<Task, "id">) };
}

/** Subscribe to all of a user's tasks (live). Returns an unsubscribe fn. */
export function watchTasks(
  uid: string,
  onChange: (tasks: Task[], meta: SnapMeta) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(userCollection(uid, "tasks"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) =>
      onChange(snap.docs.map((d) => toTask(d.id, d.data())), {
        hasPendingWrites: snap.metadata.hasPendingWrites,
        fromCache: snap.metadata.fromCache,
      }),
    (err) => onError?.(err),
  );
}

/**
 * Quick-capture: only a title is required. New tasks land in the inbox with
 * medium urgency until clarified.
 */
export async function createTask(uid: string, input: NewTask): Promise<string> {
  const ref = await addDoc(userCollection(uid, "tasks"), {
    title: input.title,
    notes: input.notes ?? "",
    urgency: input.urgency ?? 2,
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    status: input.status ?? "inbox",
    ...(input.areaId ? { areaId: input.areaId } : {}),
    ...(input.projectId ? { projectId: input.projectId } : {}),
    ...(input.estimateMinutes != null
      ? { estimateMinutes: input.estimateMinutes }
      : {}),
    ...(input.checklist?.length ? { checklist: input.checklist } : {}),
    ...(input.recurrence ? { recurrence: input.recurrence } : {}),
    ...(input.plannedFor ? { plannedFor: input.plannedFor } : {}),
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateTask(
  uid: string,
  id: string,
  patch: Partial<Omit<Task, "id" | "createdAt">>,
): Promise<void> {
  // undefined values mean "clear the field" → deleteField() (see sanitize.ts).
  await updateDoc(userDoc(uid, "tasks", id), sanitizeUpdate(patch));
}

/** Mark a task done (or reopen it). Stamps/clears completedAt. */
export async function setTaskDone(
  uid: string,
  id: string,
  done: boolean,
): Promise<void> {
  await updateDoc(userDoc(uid, "tasks", id), {
    status: done ? "done" : "active",
    completedAt: done ? Date.now() : null,
  });
}

export async function deleteTask(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "tasks", id));
}
