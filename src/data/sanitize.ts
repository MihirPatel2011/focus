/**
 * Firestore update sanitizer.
 *
 * `updateDoc` throws on `undefined` field values ("Unsupported field value:
 * undefined"). In this app an `undefined` patch value means "clear this field",
 * so we translate it to Firestore's `deleteField()` sentinel. Defined values
 * (including `null`) pass through unchanged.
 *
 * This keeps optional fields (areaId, dueDate, projectId, …) safe to set OR
 * clear through the same typed update functions — the bug that previously made
 * "Save" silently fail.
 */
import { deleteField, type FieldValue } from "firebase/firestore";

export function sanitizeUpdate<T extends Record<string, unknown>>(
  patch: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    out[key] = value === undefined ? (deleteField() as FieldValue) : value;
  }
  return out;
}
