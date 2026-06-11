import type { SVGProps } from "react";

/**
 * Hand-rolled stroke icon set for app chrome — one stroke weight (1.75), round
 * caps, 24px grid. User-facing *area* icons remain emoji (they're content and
 * must match across platforms); these are purely interface.
 */
function base(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19Z" />
    <path d="M9.5 20.5v-6h5v6" />
  </svg>
);

export const IconPlan = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v3M15.5 3.5v3" />
    <path d="m9.5 14.5 1.8 1.8 3.2-3.3" />
  </svg>
);

export const IconInbox = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 13.5 6.2 6a1.6 1.6 0 0 1 1.5-1.1h8.6A1.6 1.6 0 0 1 17.8 6L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z" />
    <path d="M4 13.5h4.5a3.5 3.5 0 0 0 7 0H20" />
  </svg>
);

export const IconTasks = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.25" />
    <path d="m8.5 12.2 2.3 2.3 4.7-4.8" />
  </svg>
);

export const IconAreas = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="3.5" />
    <circle cx="16" cy="16" r="3.5" />
    <path d="M16 4.5v7M12.5 8H19M8 12.5v7M4.5 16H11" opacity=".55" />
  </svg>
);

export const IconProjects = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4.2c.5 0 .9.2 1.2.6l1.2 1.4H19A1.5 1.5 0 0 1 20.5 9v8.5A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5Z" />
    <path d="M3.5 11h17" opacity=".55" />
  </svg>
);

export const IconFocus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="13" r="7.25" />
    <path d="M12 9.5V13l2.5 1.8M10 2.5h4" />
  </svg>
);

export const IconStats = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 20h16" />
    <path d="M7 20v-6M12 20V9M17 20V4.5" />
  </svg>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M19 12H5m6 7-7-7 7-7" />
  </svg>
);
