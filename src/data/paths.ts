/**
 * Firestore path + collection-reference helpers.
 *
 * Every document lives under `users/{uid}/...`, so every helper takes a uid.
 * This is the only place collection paths are constructed — it guarantees the
 * per-user scoping the security rules enforce, and keeps a single uid string
 * out of the rest of the codebase.
 */
import { collection, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { COLLECTIONS } from "./types";

type CollectionKey = keyof typeof COLLECTIONS;

/** Reference to a user-scoped collection, e.g. users/{uid}/tasks. */
export function userCollection(uid: string, key: CollectionKey) {
  return collection(db, "users", uid, COLLECTIONS[key]);
}

/** Reference to a single document within a user-scoped collection. */
export function userDoc(uid: string, key: CollectionKey, id: string) {
  return doc(db, "users", uid, COLLECTIONS[key], id);
}
