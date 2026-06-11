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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={{
        backgroundColor: `${area.color}14`,
        color: area.color,
        boxShadow: `inset 0 0 0 1px ${area.color}26`,
      }}
    >
      <span aria-hidden className="text-[11px]">{iconEmoji(area.icon)}</span>
      {area.name}
    </span>
  );
}
