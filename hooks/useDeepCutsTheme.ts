"use client";

import { useEffect } from "react";

// Sets `data-deep-cuts-theme` on <html> while a Deep Cuts session is
// active, so _decade-themes.scss's darker purple Deep Cuts theme cascades
// to every screen — the mode-level counterpart of useDecadeTheme. Cleared
// on unmount, or as soon as `active` goes false.
export function useDeepCutsTheme(active: boolean): void {
  useEffect(() => {
    const root = document.documentElement;
    if (active) {
      root.setAttribute("data-deep-cuts-theme", "");
    } else {
      root.removeAttribute("data-deep-cuts-theme");
    }
    return () => {
      root.removeAttribute("data-deep-cuts-theme");
    };
  }, [active]);
}
