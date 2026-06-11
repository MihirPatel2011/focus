import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTimerStore } from "@/logic/stores/timerStore";

/** Display metadata for the shortcuts help overlay. */
export const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["n"], label: "Quick add a task" },
  { keys: ["⌘", "K"], label: "Quick add a task" },
  { keys: ["i"], label: "Go to Inbox (process)" },
  { keys: ["f"], label: "Focus: start / open focus mode" },
  { keys: ["p"], label: "Pause / resume the timer" },
  { keys: ["g", "then", "h/p/i/t/a/f/s"], label: "Go to a page" },
  { keys: ["?"], label: "Show this help" },
];

/** Pages reachable via the "g then <key>" navigation chord. */
const GO_MAP: Record<string, string> = {
  h: "/",
  p: "/plan",
  i: "/inbox",
  t: "/tasks",
  a: "/areas",
  f: "/focus",
  s: "/stats",
};

function isTyping(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  return (
    !!node &&
    (["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName) ||
      node.isContentEditable)
  );
}

/**
 * Global keyboard shortcuts. Centralizes all app-wide hotkeys in one place so
 * behavior is consistent and discoverable (see SHORTCUTS / the help overlay).
 * Timer actions read the store imperatively to avoid re-registering on change.
 */
export function useGlobalShortcuts(opts: {
  openQuickAdd: () => void;
  toggleHelp: () => void;
}) {
  const { openQuickAdd, toggleHelp } = opts;
  const navigate = useNavigate();

  useEffect(() => {
    let chord: string | null = null;
    let chordTimer: ReturnType<typeof setTimeout> | undefined;
    const clearChord = () => {
      chord = null;
      if (chordTimer) clearTimeout(chordTimer);
    };

    const onKey = (e: KeyboardEvent) => {
      // ⌘/Ctrl+K works even while typing; other shortcuts don't.
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "k") {
          e.preventDefault();
          openQuickAdd();
        }
        return;
      }
      if (e.altKey || isTyping(e.target)) return;

      // Navigation chord: "g" then a destination key.
      if (chord === "g") {
        const dest = GO_MAP[e.key.toLowerCase()];
        clearChord();
        if (dest) {
          e.preventDefault();
          navigate(dest);
        }
        return;
      }

      const timer = useTimerStore.getState();
      switch (e.key) {
        case "g":
          chord = "g";
          if (chordTimer) clearTimeout(chordTimer);
          chordTimer = setTimeout(() => (chord = null), 1200);
          break;
        case "n":
          e.preventDefault();
          openQuickAdd();
          break;
        case "i":
          e.preventDefault();
          navigate("/inbox");
          break;
        case "f":
          e.preventDefault();
          if (timer.status === "idle") navigate("/focus");
          else timer.setMinimized(false);
          break;
        case "p":
          if (timer.status === "running") {
            e.preventDefault();
            timer.pause();
          } else if (timer.status === "paused") {
            e.preventDefault();
            timer.resume();
          }
          break;
        case "?":
          e.preventDefault();
          toggleHelp();
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearChord();
    };
  }, [navigate, openQuickAdd, toggleHelp]);
}
