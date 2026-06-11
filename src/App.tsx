import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { initAuthListener, useAuthStore } from "@/logic/stores/authStore";
import { useDataStore } from "@/logic/stores/dataStore";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { HomePage } from "@/pages/HomePage";
import { AreasPage } from "@/pages/AreasPage";
import { AreaDetailPage } from "@/pages/AreaDetailPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { InboxPage } from "@/pages/InboxPage";
import { TasksPage } from "@/pages/TasksPage";
import { FocusPage } from "@/pages/FocusPage";
import { PlanPage } from "@/pages/PlanPage";
import { SetupNotice } from "@/components/SetupNotice";

// Stats pulls in Recharts (~the largest dependency). Lazy-load it so the charts
// code splits into its own chunk, fetched only when the Stats page is opened.
const StatsPage = lazy(() =>
  import("@/pages/StatsPage").then((m) => ({ default: m.StatsPage })),
);

export default function App() {
  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);
  const startData = useDataStore((s) => s.start);
  const stopData = useDataStore((s) => s.stop);

  // Boot the auth listener once.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = initAuthListener();
    return unsub;
  }, []);

  // Start/stop live data subscriptions with the session.
  useEffect(() => {
    if (user) startData(user.uid);
    else stopData();
  }, [user, startData, stopData]);

  if (!isFirebaseConfigured) return <SetupNotice />;

  if (initializing) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted">Loading…</div>
        }
      >
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/areas" element={<AreasPage />} />
        <Route path="/areas/:areaId" element={<AreaDetailPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
