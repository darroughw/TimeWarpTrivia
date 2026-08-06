import type { DecadeId } from "./types";

// Shared accent color per decade — the UI recolors its highlight based on
// which era is in focus. Used by both the TV decade filter and the phone
// block-choice screen.
export const DECADE_COLORS: Record<DecadeId, string> = {
  "80s": "#ff3fa4",
  "90s": "#7c5cff",
  "2000s": "#33d6ff",
  "2010s": "#ff8a3d",
  all: "#ffb238",
};
