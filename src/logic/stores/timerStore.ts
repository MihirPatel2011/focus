/**
 * Focus-timer state (Zustand) — the heart of the app.
 *
 * Pure session/timer logic, fully decoupled from UI: a session targets exactly
 * ONE area and ONE project, plus one or more tasks. Elapsed time is derived
 * from accumulated time + the current running segment, so it stays correct
 * across pause/resume and component re-mounts. On stop it persists a TimeLog.
 *
 * The UI ticks a 1s interval to re-render; the store itself holds no interval.
 */
import { create } from "zustand";
import { createTimeLog } from "@/data/timeLogs";
import { setTaskDone } from "@/data/tasks";
import { setTaskCompletion } from "@/logic/taskActions";
import { useDataStore } from "./dataStore";

export type TimerStatus = "idle" | "running" | "paused";

interface TimerState {
  status: TimerStatus;
  areaId?: string;
  projectId?: string;
  taskIds: string[];
  completedTaskIds: string[];
  /** Epoch ms the session first started. */
  startTime?: number;
  /** Seconds banked from completed run segments (before the current one). */
  accumulatedSeconds: number;
  /** Epoch ms the current running segment began (undefined when paused). */
  segmentStart?: number;
  /** Last interaction ms — drives the idle "Still working?" nudge. */
  lastInteraction?: number;
  /** UI: whether the distraction-free focus overlay is minimized. */
  minimized: boolean;

  configure: (sel: {
    areaId: string;
    projectId?: string;
    taskIds: string[];
  }) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Record that the user is still present (resets the idle timer). */
  ping: () => void;
  setMinimized: (minimized: boolean) => void;
  toggleTask: (uid: string, taskId: string) => Promise<void>;
  /** Stop, persist a TimeLog for `uid`, and reset. Returns the saved duration. */
  stop: (uid: string, note?: string) => Promise<number>;
  cancel: () => void;
  /** Derived elapsed seconds at `now` (default Date.now()). */
  elapsedSeconds: (now?: number) => number;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  status: "idle",
  taskIds: [],
  completedTaskIds: [],
  accumulatedSeconds: 0,
  minimized: false,

  configure: ({ areaId, projectId, taskIds }) => {
    if (get().status !== "idle") return; // don't reconfigure a live session
    set({ areaId, projectId, taskIds, completedTaskIds: [] });
  },

  start: () => {
    if (get().status === "running") return;
    set({
      status: "running",
      startTime: get().startTime ?? Date.now(),
      segmentStart: Date.now(),
      lastInteraction: Date.now(),
      minimized: false,
    });
  },

  ping: () => set({ lastInteraction: Date.now() }),

  setMinimized: (minimized) => set({ minimized }),

  pause: () => {
    const { status, accumulatedSeconds, segmentStart } = get();
    if (status !== "running" || segmentStart == null) return;
    const banked = accumulatedSeconds + (Date.now() - segmentStart) / 1000;
    set({
      status: "paused",
      accumulatedSeconds: banked,
      segmentStart: undefined,
      lastInteraction: Date.now(),
    });
  },

  resume: () => {
    if (get().status !== "paused") return;
    set({
      status: "running",
      segmentStart: Date.now(),
      lastInteraction: Date.now(),
    });
  },

  toggleTask: async (uid, taskId) => {
    const { completedTaskIds } = get();
    const done = !completedTaskIds.includes(taskId);
    set({
      completedTaskIds: done
        ? [...completedTaskIds, taskId]
        : completedTaskIds.filter((id) => id !== taskId),
      lastInteraction: Date.now(),
    });
    // Reflect completion in the task itself. Use the shared completion action
    // so completing a recurring task here also spawns its next instance.
    const task = useDataStore.getState().tasks.find((t) => t.id === taskId);
    if (task) await setTaskCompletion(uid, task, done);
    else await setTaskDone(uid, taskId, done);
  },

  stop: async (uid, note) => {
    const state = get();
    const end = Date.now();
    const durationSeconds = Math.round(state.elapsedSeconds(end));
    const start = state.startTime ?? end - durationSeconds * 1000;

    if (state.areaId && durationSeconds > 0) {
      await createTimeLog(uid, {
        startTime: start,
        endTime: end,
        durationSeconds,
        areaId: state.areaId,
        projectId: state.projectId,
        taskIds: state.taskIds,
        completedTaskIds: state.completedTaskIds,
        note: note?.trim() || undefined,
      });
    }
    get().cancel();
    return durationSeconds;
  },

  cancel: () =>
    set({
      status: "idle",
      areaId: undefined,
      projectId: undefined,
      taskIds: [],
      completedTaskIds: [],
      startTime: undefined,
      accumulatedSeconds: 0,
      segmentStart: undefined,
      lastInteraction: undefined,
      minimized: false,
    }),

  elapsedSeconds: (now = Date.now()) => {
    const { status, accumulatedSeconds, segmentStart } = get();
    if (status === "running" && segmentStart != null) {
      return accumulatedSeconds + (now - segmentStart) / 1000;
    }
    return accumulatedSeconds;
  },
}));
