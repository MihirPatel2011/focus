import type { ComponentType, ReactNode, SVGProps } from "react";
import { useCallback, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/logic/stores/authStore";
import { useGlobalShortcuts } from "@/logic/useGlobalShortcuts";
import { QuickAdd } from "@/components/QuickAdd";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { FocusOverlay } from "@/components/FocusOverlay";
import { FocusPill } from "@/components/FocusPill";
import { SyncStatus } from "@/components/SyncStatus";
import {
  IconAreas,
  IconFocus,
  IconHome,
  IconInbox,
  IconPlan,
  IconPlus,
  IconProjects,
  IconStats,
  IconTasks,
} from "@/components/icons";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
};

const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: IconHome, end: true },
  { to: "/plan", label: "Plan", icon: IconPlan },
  { to: "/inbox", label: "Inbox", icon: IconInbox },
  { to: "/tasks", label: "Tasks", icon: IconTasks },
  { to: "/areas", label: "Areas", icon: IconAreas },
  { to: "/projects", label: "Projects", icon: IconProjects },
  { to: "/focus", label: "Focus", icon: IconFocus },
  { to: "/stats", label: "Stats", icon: IconStats },
];

/** Mobile keeps the five daily destinations; the rest live on Home/Areas. */
const MOBILE_NAV = NAV.filter((n) =>
  ["/", "/plan", "/inbox", "/focus", "/tasks"].includes(n.to),
);

/**
 * Responsive shell: quiet sidebar on desktop, five-tab bar + FAB on mobile.
 * Hosts global quick-add ("n" / Cmd+K) and the focus-mode overlay.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const logout = useAuthStore((s) => s.logout);
  const email = useAuthStore((s) => s.user?.email);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useGlobalShortcuts({
    openQuickAdd: useCallback(() => setQuickAddOpen(true), []),
    toggleHelp: useCallback(() => setHelpOpen((v) => !v), []),
  });

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line/70 p-5 md:flex">
        <div className="mb-7 flex items-baseline gap-1.5 px-2">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 translate-y-px rounded-full bg-ember"
          />
          <span className="font-display text-[1.35rem] font-semibold tracking-tight">
            focus
          </span>
        </div>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="mb-5 flex items-center justify-between rounded-xl bg-ink px-3.5 py-2.5 text-sm font-medium text-canvas shadow-soft transition-all duration-200 hover:-translate-y-px hover:shadow-lift active:translate-y-0 active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <IconPlus className="h-4 w-4" /> New task
          </span>
          <span className="kbd border-white/15 bg-white/10 text-canvas/70">
            n
          </span>
        </button>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-ink/[0.07] font-semibold text-ink"
                    : "font-medium text-soft hover:bg-ink/[0.04] hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`h-[18px] w-[18px] transition-colors ${
                      isActive ? "text-ink" : "text-muted group-hover:text-soft"
                    }`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-line/70 pt-4 text-xs text-muted">
          <div className="truncate" title={email ?? ""}>
            {email}
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <button
              onClick={() => logout()}
              className="text-soft transition-colors hover:text-ink"
            >
              Sign out
            </button>
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 transition-colors hover:text-ink"
              title="Keyboard shortcuts"
            >
              <span className="kbd">?</span> Shortcuts
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-36 md:pb-0">
        <div className="animate-rise mx-auto max-w-3xl p-4 pt-6 md:p-10">
          {children}
        </div>
      </main>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  isActive ? "text-ink" : "text-muted"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-7 w-12 place-content-center rounded-full transition-colors ${
                      isActive ? "bg-ink/[0.08]" : ""
                    }`}
                  >
                    <item.icon className="h-[19px] w-[19px]" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Floating quick-add (mobile) */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 grid h-13 w-13 place-content-center rounded-2xl bg-ink text-canvas shadow-lift transition-transform active:scale-90 md:hidden"
        aria-label="Quick add task"
      >
        <IconPlus className="h-6 w-6" />
      </button>

      <QuickAdd open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Distraction-free focus mode + minimized pill (global). */}
      <FocusOverlay />
      <FocusPill />
      <SyncStatus />
    </div>
  );
}
