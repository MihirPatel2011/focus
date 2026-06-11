/**
 * Data access for Projects. Pure Firestore I/O — no React, no UI.
 */
import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import type { NewProject, Project, SnapMeta } from "./types";
import { userCollection, userDoc } from "./paths";
import { sanitizeUpdate } from "./sanitize";

function toProject(id: string, data: Record<string, unknown>): Project {
  return { id, ...(data as Omit<Project, "id">) };
}

/** Subscribe to all of a user's projects (live). Returns an unsubscribe fn. */
export function watchProjects(
  uid: string,
  onChange: (projects: Project[], meta: SnapMeta) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(userCollection(uid, "projects"), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) =>
      onChange(snap.docs.map((d) => toProject(d.id, d.data())), {
        hasPendingWrites: snap.metadata.hasPendingWrites,
        fromCache: snap.metadata.fromCache,
      }),
    (err) => onError?.(err),
  );
}

export async function createProject(
  uid: string,
  input: NewProject,
): Promise<string> {
  const ref = await addDoc(userCollection(uid, "projects"), {
    name: input.name,
    areaId: input.areaId,
    description: input.description ?? "",
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    status: input.status ?? "active",
    priority: input.priority ?? 2,
    archived: false,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateProject(
  uid: string,
  id: string,
  patch: Partial<Omit<Project, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(userDoc(uid, "projects", id), sanitizeUpdate(patch));
}

export async function archiveProject(
  uid: string,
  id: string,
  archived = true,
): Promise<void> {
  await updateDoc(userDoc(uid, "projects", id), { archived });
}

export async function deleteProject(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "projects", id));
}
