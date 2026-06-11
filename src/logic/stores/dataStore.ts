/**
 * App data cache (Zustand). Subscribes to the current user's Firestore
 * collections and mirrors them in memory so the UI reads synchronously.
 * Firestore remains the source of truth; this is just the live local cache.
 */
import { create } from "zustand";
import type { Area, Project, Task, TimeLog } from "@/data/types";
import { watchAreas } from "@/data/areas";
import { watchProjects } from "@/data/projects";
import { watchTasks } from "@/data/tasks";
import { watchTimeLogs } from "@/data/timeLogs";

interface DataState {
  areas: Area[];
  projects: Project[];
  tasks: Task[];
  timeLogs: TimeLog[];
  loaded: boolean;
  error: string | null;
  /** True when local edits haven't yet been acknowledged by the server. */
  pendingWrites: boolean;
  /** Internal: active Firestore unsubscribe callbacks. */
  _unsubs: Array<() => void>;
  /** Begin live subscriptions for a user. Safe to call repeatedly. */
  start: (uid: string) => void;
  /** Tear down subscriptions and clear the cache (on logout). */
  stop: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  areas: [],
  projects: [],
  tasks: [],
  timeLogs: [],
  loaded: false,
  error: null,
  pendingWrites: false,
  _unsubs: [],

  start: (uid) => {
    // Reset any previous subscriptions first.
    get()._unsubs.forEach((fn) => fn());

    const onError = (e: Error) => set({ error: e.message });

    // Aggregate pending-write state across all collections into one flag.
    const pending: Record<string, boolean> = {};
    const note = (key: string, hasPending: boolean) => {
      pending[key] = hasPending;
      set({ pendingWrites: Object.values(pending).some(Boolean) });
    };

    const unsubs = [
      watchAreas(
        uid,
        (areas, meta) => {
          set({ areas, loaded: true });
          note("areas", meta.hasPendingWrites);
        },
        onError,
      ),
      watchProjects(
        uid,
        (projects, meta) => {
          set({ projects });
          note("projects", meta.hasPendingWrites);
        },
        onError,
      ),
      watchTasks(
        uid,
        (tasks, meta) => {
          set({ tasks });
          note("tasks", meta.hasPendingWrites);
        },
        onError,
      ),
      watchTimeLogs(
        uid,
        (timeLogs, meta) => {
          set({ timeLogs });
          note("timeLogs", meta.hasPendingWrites);
        },
        onError,
      ),
    ];
    set({ _unsubs: unsubs, error: null });
  },

  stop: () => {
    get()._unsubs.forEach((fn) => fn());
    set({
      _unsubs: [],
      areas: [],
      projects: [],
      tasks: [],
      timeLogs: [],
      loaded: false,
      error: null,
      pendingWrites: false,
    });
  },
}));

// ─── Selectors (derive-on-read; keep components dumb) ───

export function selectArea(areas: Area[], id?: string): Area | undefined {
  return id ? areas.find((a) => a.id === id) : undefined;
}
