import type { Decade, DecadeId } from "./types";

// Shared accent color per decade — the UI recolors its highlight based on
// which era is in focus. Used by both the TV decade filter and the phone
// block-choice screen.
//
// 90s is lightened from the original #7c5cff — dark $ink text on top of
// that color (DecadeFilter's selected pill, BlockScreen/BlockChoiceScreen's
// decadeTag) landed at 4.15:1 contrast, just under WCAG AA's 4.5:1 minimum
// for normal-weight text at this size. #8a6dff clears it at 4.91:1.
export const DECADE_COLORS: Record<DecadeId, string> = {
  "80s": "#ff3fa4",
  "90s": "#8a6dff",
  "2000s": "#33d6ff",
  "2010s": "#ff8a3d",
  all: "#ffb238",
};

// "all" is a UI filter sentinel, not real question content, so it's never
// a row in the `decades` table — LiveTvFlow appends this after fetching
// the real decades from the database.
export const ALL_DECADES_OPTION: Decade = { id: "all", label: "All Decades" };
