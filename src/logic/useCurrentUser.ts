/**
 * Convenience hooks bridging the auth store to the rest of the app.
 */
import { useAuthStore } from "./stores/authStore";

/** The current user's uid, or undefined when signed out. */
export function useUid(): string | undefined {
  return useAuthStore((s) => s.user?.uid);
}
