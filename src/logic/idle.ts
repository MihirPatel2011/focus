/**
 * Idle / long-session nudge logic — pure and testable, no React.
 *
 * While a focus session runs we track the last interaction time. If too long
 * passes without any interaction (ticking a task, pausing, confirming presence)
 * we surface a gentle "Still working?" prompt so logged time stays accurate.
 */

/** How long without interaction before we nudge. */
export const IDLE_NUDGE_MS = 20 * 60 * 1000; // 20 minutes

/**
 * Whether the nudge should be shown.
 * @param lastInteraction epoch ms of the last interaction (undefined = never)
 * @param now             current epoch ms
 * @param thresholdMs     idle threshold (defaults to IDLE_NUDGE_MS)
 */
export function shouldNudge(
  lastInteraction: number | undefined,
  now: number,
  thresholdMs: number = IDLE_NUDGE_MS,
): boolean {
  if (lastInteraction == null) return false;
  return now - lastInteraction >= thresholdMs;
}
