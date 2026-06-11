import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/logic/stores/authStore";
import { useGlobalShortcuts } from "@/logic/useGlobalShortcuts";
import { QuickAdd } from "@/components/QuickAdd";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { FocusOverlay } from "@/components/FocusOverlay";
import { FocusPill } from "@/components/FocusPill";
import { SyncStatus } from "@/components/SyncStatus";

const NAV = [
  { to: "/", label: "Home", icon: "🏠", end: true },
  { to: "/plan", label: "Plan", icon: "🗓️" },
  { to: "/inbox", label: "Inbox", icon: "📥" },
  { to: "/tasks", label: "Tasks", icon: "✅" },
  { to: "/areas", label: "Areas", icon: "🗂️" },
  { to: "/projects", label: "Projects", icon: "📁" },
  { to: "/focus", label: "Focus", icon: "⏱️" },
  { to: "/stats", label: "Stats", icon: "📊" },
];

/**
 * Responsive shell: sidebar on desktop, bottom tab bar on mobile.
 * Hosts global quick-add (also openable with the "n" / Cmd+K shortcuts).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const logout = useAuthStore((s) => s.logout);
  const email = useAuthStore((s) => s.user?.email);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Centralized global keyboard shortcuts (quick-add, timer, nav, help).
  useGlobalShortcuts({
    openQuickAdd: useCallback(() => setQuickAddOpen(true), []),
    toggleHelp: useCallback(() => setHelpOpen((v) => !v), []),
  });

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold">
          <span aria-hidden>🎯</span> Focus
        </div>
        <button
          onClick={() => setQuickAddOpen(true)}
          className="mb-4 rounded-lg bg-ink px-3 py-2 text-left text-sm font-medium text-white hover:bg-slate-700"
        >
          + Quick add <span className="float-right opacity-60">n</span>
        </button>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="mt-4 border-t border-line pt-3 text-xs text-muted">
          <div className="truncate" title={email ?? ""}>
            {email}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <button
              onClick={() => logout()}
              className="text-ink hover:underline"
            >
              Sign out
            </button>
            <button
              onClick={() => setHelpOpen(true)}
              className="hover:text-ink"
              title="Keyboard shortcuts"
            >
              <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 font-mono">
                ?
              </kbd>{" "}
              Shortcuts
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="mx-auto max-w-3xl p-4 md:p-8">{children}</div>
      </main>

      {/* Bottom tab bar (mobile) — horizontally scrollable for all destinations */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-line bg-surface/95 backdrop-blur md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-w-[3.5rem] flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                isActive ? "text-ink" : "text-muted"
              }`
            }
          >
            <span aria-hidden className="text-lg">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Floating quick-add on mobile */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-16 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-2xl text-white shadow-lg md:hidden"
        aria-label="Quick add task"
      >
        +
      </button>

      <QuickAdd open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Distraction-free focus mode + minimized pill (global, route-agnostic). */}
      <FocusOverlay />
      <FocusPill />
      <SyncStatus />
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? "bg-line/70 text-ink" : "text-muted hover:bg-line/40"
        }`
      }
    >
      <span aria-hidden>{icon}</span>
      {label}
    </NavLink>
  );
}
