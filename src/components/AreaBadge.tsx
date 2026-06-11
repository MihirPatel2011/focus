import type { Area } from "@/data/types";
import { iconEmoji } from "@/lib/icons";

/** A small color-coded chip representing an area, used across the app. */
export function AreaBadge({ area, className = "" }: { area?: Area; className?: string }) {
  if (!area) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-muted ${className}`}>
        No area
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: `${area.color}1a`, color: area.color }}
    >
      <span aria-hidden>{iconEmoji(area.icon)}</span>
      {area.name}
    </span>
  );
}
