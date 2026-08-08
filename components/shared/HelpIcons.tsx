import type { HelpIconName } from "@/lib/helpContent";

// Simple single-weight line-art icons, one per help step. Deliberately
// plain geometric shapes (not detailed illustration) so they read clearly
// at small sizes and hold up in both the marigold-on-void and paper-on-ink
// contexts this modal renders in. All share one viewBox/stroke treatment
// so swapping between them never shifts weight or scale.

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Tv() {
  return (
    <svg viewBox="0 0 24 24" {...STROKE}>
      <path d="M8 3 12 7 16 3" />
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M9 22h6M12 19v3" />
    </svg>
  );
}

function Calendar() {
  return (
    <svg viewBox="0 0 24 24" {...STROKE}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 14h2M14 14h2M8 17h2M14 17h2" />
    </svg>
  );
}

function CodeBadge() {
  return (
    <svg viewBox="0 0 24 24" {...STROKE}>
      <rect x="2" y="7" width="20" height="10" rx="3" />
      <path d="M8 11v2M12 11v2M16 11v2" />
    </svg>
  );
}

function Play() {
  return (
    <svg viewBox="0 0 24 24" {...STROKE}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5 16 12 10 15.5Z" />
    </svg>
  );
}

function Phone() {
  return (
    <svg viewBox="0 0 24 24" {...STROKE}>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 19h2" />
    </svg>
  );
}

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" {...STROKE}>
      <path d="M13 2 5 14h6l-1 8 9-13h-6z" />
    </svg>
  );
}

function Spotlight() {
  return (
    <svg viewBox="0 0 24 24" {...STROKE}>
      <path d="M9 2h6l2 9H7z" />
      <ellipse cx="12" cy="19" rx="7" ry="3" />
    </svg>
  );
}

function Trophy() {
  return (
    <svg viewBox="0 0 24 24" {...STROKE}>
      <path d="M7 3h10v6a5 5 0 0 1-10 0Z" />
      <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" />
      <path d="M12 14v3M8 21h8M9 21c0-2 1-3 3-3s3 1 3 3" />
    </svg>
  );
}

const ICONS: Record<HelpIconName, () => JSX.Element> = {
  tv: Tv,
  calendar: Calendar,
  code: CodeBadge,
  play: Play,
  phone: Phone,
  bolt: Bolt,
  spotlight: Spotlight,
  trophy: Trophy,
};

interface HelpIconProps {
  name: HelpIconName;
  className?: string;
}

export default function HelpIcon({ name, className }: HelpIconProps) {
  const Icon = ICONS[name];
  return (
    <span className={className} aria-hidden="true">
      <Icon />
    </span>
  );
}
