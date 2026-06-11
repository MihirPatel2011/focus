/**
 * A small curated set of area icons and a palette of calm accent colors.
 * Icons are plain emoji so we ship zero icon-font weight and they render
 * identically on web, iOS, and macOS (important for the Capacitor wrap).
 */
export const AREA_ICONS: { key: string; emoji: string; label: string }[] = [
  { key: "briefcase", emoji: "💼", label: "Business" },
  { key: "heart", emoji: "❤️", label: "Health" },
  { key: "home", emoji: "🏠", label: "Family" },
  { key: "book", emoji: "📚", label: "Learning" },
  { key: "dollar", emoji: "💰", label: "Finance" },
  { key: "dumbbell", emoji: "🏋️", label: "Fitness" },
  { key: "palette", emoji: "🎨", label: "Creative" },
  { key: "sprout", emoji: "🌱", label: "Growth" },
  { key: "users", emoji: "👥", label: "Social" },
  { key: "rocket", emoji: "🚀", label: "Projects" },
  { key: "brain", emoji: "🧠", label: "Mind" },
  { key: "star", emoji: "⭐", label: "Other" },
];

const ICON_MAP = new Map(AREA_ICONS.map((i) => [i.key, i.emoji]));

export function iconEmoji(key: string | undefined): string {
  return (key && ICON_MAP.get(key)) || "⭐";
}

/** Calm, distinguishable accent colors for areas. */
export const AREA_COLORS = [
  "#2563eb", // blue
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#db2777", // pink
  "#65a30d", // lime
  "#475569", // slate
  "#ea580c", // orange
];
