// Per-topic accent color for Deep Cuts (TIM-41) — same role as
// decadeColors.ts's DECADE_COLORS, but an open record rather than a
// closed union, since new topics are meant to be added over time with
// zero code changes. Both pre-checked against $ink the same way
// decadeColors.ts documents its own choices: west-wing ~7.46:1,
// fallout ~13.32:1, both clearing the 4.5:1 WCAG AA floor.
export const DEEP_CUT_TOPIC_COLORS: Record<string, string> = {
  "west-wing": "#c9a227", // presidential gold
  fallout: "#00ff66", // Pip-Boy terminal green
};

export const DEFAULT_DEEP_CUT_COLOR = "#ffb238"; // fallback for a topic without a specific entry yet
