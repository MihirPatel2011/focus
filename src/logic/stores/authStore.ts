/**
 * Auth state (Zustand). Wraps Firebase Auth so UI never touches the SDK
 * directly — the same store can back a Capacitor native build later.
 */
import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/firebase";

interface AuthState {
  user: User | null;
  /** True until the first auth state callback fires. */
  initializing: boolean;
  error: string | null;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  error: null,

  signInEmail: async (email, password) => {
    set({ error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      set({ error: friendlyAuthError(e) });
      throw e;
    }
  },

  signUpEmail: async (email, password) => {
    set({ error: null });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      set({ error: friendlyAuthError(e) });
      throw e;
    }
  },

  signInGoogle: async () => {
    set({ error: null });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      set({ error: friendlyAuthError(e) });
      throw e;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  clearError: () => set({ error: null }),
}));

/** Start listening to Firebase auth changes. Call once at app boot. */
export function initAuthListener(): () => void {
  return onAuthStateChanged(auth, (user) => {
    useAuthStore.setState({ user, initializing: false });
  });
}

function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account already exists for that email.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/unauthorized-domain":
      return "This domain isn't authorized in Firebase Auth settings.";
    default:
      return (e as Error)?.message ?? "Something went wrong. Please try again.";
  }
}
