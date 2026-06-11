import { TaskBoard } from "@/components/TaskBoard";

export function TasksPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted">
          Filter, group, and sort across all your tasks.
        </p>
      </header>
      <TaskBoard defaultView="today" />
    </div>
  );
}
