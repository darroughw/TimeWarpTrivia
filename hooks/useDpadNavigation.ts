"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = "[data-dpad-focusable]:not([disabled])";

/**
 * Gives a screen container arrow-key navigation between everything marked
 * data-dpad-focusable, so the whole app is drivable from a D-pad/remote
 * with no pointer involved. Autofocuses the first focusable item on mount.
 */
export function useDpadNavigation<T extends HTMLElement>(active = true) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    const focusable = getFocusable();
    if (focusable.length > 0 && !container.contains(document.activeElement)) {
      focusable[0].focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }

      const items = getFocusable();
      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
      const delta = forward ? 1 : -1;
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + delta + items.length) % items.length;

      event.preventDefault();
      items[nextIndex].focus();
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return containerRef;
}
