"use client";

import { useEffect } from "react";
import type { DecadeId } from "@/lib/types";

// Decades with a built-in visual theme (TIM-14). Everything else
// (including "all") falls back to the base design system tokens.
const THEMED_DECADES: DecadeId[] = ["80s"];

// Sets `data-decade-theme` on <html> once a decade's picked in the lobby,
// so _decade-themes.scss's overrides cascade to every screen — TV and
// phone alike — for the rest of the session. Cleared on unmount so
// leaving the game (or "Play Again" into a fresh room) doesn't leave a
// stale theme applied.
export function useDecadeTheme(decadeFilter: DecadeId | null | undefined): void {
  useEffect(() => {
    const root = document.documentElement;
    if (decadeFilter && THEMED_DECADES.includes(decadeFilter)) {
      root.setAttribute("data-decade-theme", decadeFilter);
    } else {
      root.removeAttribute("data-decade-theme");
    }
    return () => {
      root.removeAttribute("data-decade-theme");
    };
  }, [decadeFilter]);
}
