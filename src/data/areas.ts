/**
 * Data access for Areas. Pure Firestore I/O — no React, no UI.
 */
import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import type { Area, NewArea, SnapMeta } from "./types";
import { userCollection, userDoc } from "./paths";
import { sanitizeUpdate } from "./sanitize";

/** Strip the Firestore id when writing; merge it back when reading. */
function toArea(id: string, data: Record<string, unknown>): Area {
  return { id, ...(data as Omit<Area, "id">) };
}

/**
 * Subscribe to a user's areas (live). Returns an unsubscribe function.
 * Ordered by `order` then `createdAt` for a stable list.
 */
export function watchAreas(
  uid: string,
  onChange: (areas: Area[], meta: SnapMeta) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    userCollection(uid, "areas"),
    orderBy("order", "asc"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) =>
      onChange(snap.docs.map((d) => toArea(d.id, d.data())), {
        hasPendingWrites: snap.metadata.hasPendingWrites,
        fromCache: snap.metadata.fromCache,
      }),
    (err) => onError?.(err),
  );
}

export async function createArea(uid: string, input: NewArea): Promise<string> {
  const ref = await addDoc(userCollection(uid, "areas"), {
    name: input.name,
    color: input.color,
    icon: input.icon,
    description: input.description ?? "",
    ...(input.weeklyTimeGoalHours != null
      ? { weeklyTimeGoalHours: input.weeklyTimeGoalHours }
      : {}),
    archived: false,
    order: input.order ?? Date.now(),
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateArea(
  uid: string,
  id: string,
  patch: Partial<Omit<Area, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(userDoc(uid, "areas", id), sanitizeUpdate(patch));
}

export async function archiveArea(
  uid: string,
  id: string,
  archived = true,
): Promise<void> {
  await updateDoc(userDoc(uid, "areas", id), { archived });
}

export async function deleteArea(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "areas", id));
}
