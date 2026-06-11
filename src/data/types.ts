/**
 * Firestore data model — shared TypeScript types.
 *
 * These types are the contract between the data layer (`src/data`), the business
 * logic (`src/logic`), and the UI (`src/components`, `src/pages`). They are
 * framework-agnostic so they can be reused directly in a future Capacitor wrap.
 *
 * Storage layout (per-user scoped — see firestore.rules):
 *   users/{uid}/areas/{areaId}
 *   users/{uid}/projects/{projectId}
 *   users/{uid}/tasks/{taskId}
 *   users/{uid}/timeLogs/{timeLogId}
 */

/** ISO-8601 date string, e.g. "2026-06-10". Used for calendar dates (no time). */
export type IsoDate = string;

/** Epoch milliseconds. Used for precise timestamps. */
export type Millis = number;

// ───────────────────────────── Area ─────────────────────────────

export interface Area {
  id: string;
  name: string;
  /** Hex color, e.g. "#2563eb". Used consistently across the whole app. */
  color: string;
  /** Lucide-style icon key (see src/lib/icons). */
  icon: string;
  description?: string;
  /** Optional weekly time goal in hours. */
  weeklyTimeGoalHours?: number;
  archived: boolean;
  /** Manual sort order (ascending). */
  order: number;
  createdAt: Millis;
}

/** Fields a user supplies when creating an Area; the rest are defaulted. */
export type NewArea = Pick<Area, "name" | "color" | "icon"> &
  Partial<Pick<Area, "description" | "weeklyTimeGoalHours" | "order">>;

// ─────────────────────────── Project ────────────────────────────

export type ProjectStatus = "active" | "on-hold" | "done";

export interface Project {
  id: string;
  name: string;
  description?: string;
  dueDate?: IsoDate;
  status: ProjectStatus;
  /** Priority 1–4 (low → urgent), mirrors task urgency scale. */
  priority: number;
  areaId: string;
  archived: boolean;
  createdAt: Millis;
}

export type NewProject = Pick<Project, "name" | "areaId"> &
  Partial<Pick<Project, "description" | "dueDate" | "status" | "priority">>;

// ───────────────────────────── Task ─────────────────────────────

/** 1 = low, 2 = medium, 3 = high, 4 = urgent. */
export type Urgency = 1 | 2 | 3 | 4;

/** inbox → clarified → active → done (the GTD-style processing flow). */
export type TaskStatus = "inbox" | "clarified" | "active" | "done";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export interface Recurrence {
  frequency: RecurrenceFrequency;
  /** Every N units of `frequency`. */
  interval: number;
  /** For weekly recurrence: 0 (Sun) – 6 (Sat). */
  daysOfWeek?: number[];
  nextDueDate?: IsoDate;
}

/** A tickable step inside a task. */
export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  /** Optional sub-steps (checklist) within the task. */
  checklist?: ChecklistItem[];
  urgency: Urgency;
  dueDate?: IsoDate;
  status: TaskStatus;
  /** Optional until the task is clarified. */
  areaId?: string;
  projectId?: string;
  estimateMinutes?: number;
  recurrence?: Recurrence;
  /** ISO date the task is planned for (daily planning). */
  plannedFor?: IsoDate;
  createdAt: Millis;
  completedAt?: Millis;
}

export type NewTask = Pick<Task, "title"> &
  Partial<
    Pick<
      Task,
      | "notes"
      | "checklist"
      | "urgency"
      | "dueDate"
      | "status"
      | "areaId"
      | "projectId"
      | "estimateMinutes"
      | "recurrence"
      | "plannedFor"
    >
  >;

// ─────────────────────────── TimeLog ────────────────────────────

export interface TimeLog {
  id: string;
  startTime: Millis;
  endTime: Millis;
  durationSeconds: number;
  areaId: string;
  projectId?: string;
  /** Tasks worked on during the session. */
  taskIds: string[];
  /** Tasks ticked off during the session. */
  completedTaskIds: string[];
  /** Optional session reflection. */
  note?: string;
  createdAt: Millis;
}

export type NewTimeLog = Pick<
  TimeLog,
  "startTime" | "endTime" | "durationSeconds" | "areaId"
> &
  Partial<Pick<TimeLog, "projectId" | "taskIds" | "completedTaskIds" | "note">>;

/**
 * Snapshot sync metadata surfaced by the live watchers. `hasPendingWrites` is
 * true when local changes haven't yet been acknowledged by the server (e.g.
 * edits made offline); `fromCache` is true when data was served from the
 * offline cache rather than the server.
 */
export interface SnapMeta {
  hasPendingWrites: boolean;
  fromCache: boolean;
}

/** Collection names, kept in one place to avoid typos across the data layer. */
export const COLLECTIONS = {
  areas: "areas",
  projects: "projects",
  tasks: "tasks",
  timeLogs: "timeLogs",
} as const;
