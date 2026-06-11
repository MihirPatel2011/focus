/**
 * Data access for TimeLogs. Pure Firestore I/O — no React, no UI.
 */
import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import type { NewTimeLog, SnapMeta, TimeLog } from "./types";
import { userCollection, userDoc } from "./paths";
import { sanitizeUpdate } from "./sanitize";

function toTimeLog(id: string, data: Record<string, unknown>): TimeLog {
  return { id, ...(data as Omit<TimeLog, "id">) };
}

/** Subscribe to a user's time logs (live), newest first. */
export function watchTimeLogs(
  uid: string,
  onChange: (logs: TimeLog[], meta: SnapMeta) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    userCollection(uid, "timeLogs"),
    orderBy("startTime", "desc"),
  );
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) =>
      onChange(snap.docs.map((d) => toTimeLog(d.id, d.data())), {
        hasPendingWrites: snap.metadata.hasPendingWrites,
        fromCache: snap.metadata.fromCache,
      }),
    (err) => onError?.(err),
  );
}

export async function createTimeLog(
  uid: string,
  input: NewTimeLog,
): Promise<string> {
  const ref = await addDoc(userCollection(uid, "timeLogs"), {
    startTime: input.startTime,
    endTime: input.endTime,
    durationSeconds: input.durationSeconds,
    areaId: input.areaId,
    ...(input.projectId ? { projectId: input.projectId } : {}),
    taskIds: input.taskIds ?? [],
    completedTaskIds: input.completedTaskIds ?? [],
    ...(input.note ? { note: input.note } : {}),
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateTimeLog(
  uid: string,
  id: string,
  patch: Partial<Omit<TimeLog, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(userDoc(uid, "timeLogs", id), sanitizeUpdate(patch));
}

export async function deleteTimeLog(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "timeLogs", id));
}
