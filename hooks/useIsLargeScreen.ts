"use client";

import { useEffect, useState } from "react";

// The host screen is a "10-foot UI" meant to be shared by the whole
// room — a TV, a laptop, a monitor. A phone (or a small tablet held in
// portrait) can't serve that purpose, so callers use this to swap in
// instructions instead of squeezing the real game onto a screen only
// one person can see. 768px covers phones and small tablets; real hosts
// are expected to be on something noticeably bigger.
const BREAKPOINT_QUERY = "(min-width: 768px)";

// null = not yet resolved (server render / before the first effect
// runs) — callers should treat this as "don't know yet," not "small."
export function useIsLargeScreen(): boolean | null {
  const [isLarge, setIsLarge] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT_QUERY);
    setIsLarge(mql.matches);

    function handleChange(event: MediaQueryListEvent) {
      setIsLarge(event.matches);
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isLarge;
}
