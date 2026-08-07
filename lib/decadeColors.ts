import type { Decade, DecadeId } from "./types";

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

// "all" is a UI filter sentinel, not real question content, so it's never
// a row in the `decades` table — LiveTvFlow appends this after fetching
// the real decades from the database.
export const ALL_DECADES_OPTION: Decade = { id: "all", label: "All Decades" };
