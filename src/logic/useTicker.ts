import { useEffect, useState } from "react";

/**
 * Re-renders the calling component every `ms` while `active` is true.
 * Used to animate the live timer without storing elapsed time in state.
 */
export function useTicker(active: boolean, ms = 1000): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return Date.now();
}
