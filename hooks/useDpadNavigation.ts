"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = "[data-dpad-focusable]:not([disabled])";

/**
 * Gives a screen container arrow-key navigation between everything marked
 * data-dpad-focusable, so the whole app is drivable from a D-pad/remote
 * with no pointer involved. Autofocuses the first focusable item on mount,
 * and traps both arrow-key and Tab navigation within the container — the
 * same containment a modal dialog needs to keep focus off whatever's
 * behind it, so HelpModal/FeedbackModal get it for free by reusing this
 * hook instead of a separate focus-trap implementation.
 *
 * Modals render nested inside whichever screen opened them (a button
 * inside LobbyScreen's own containerRef renders the modal as its sibling),
 * so a keydown fired at the modal bubbles past its container and would
 * also reach the screen's container listener underneath. Without
 * stopPropagation, an arrow key pressed inside an open modal was
 * re-handled by the screen behind it too — silently refocusing one of
 * *its* items while the modal stayed visually open on top, stranding
 * keyboard/D-pad navigation with no way back into the modal's own
 * content. Every branch below that moves focus stops propagation so only
 * the innermost (topmost) active container ever reacts to a given key.
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
      const items = getFocusable();
      if (items.length === 0) return;
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      if (event.key === "Tab") {
        // Native Tab order otherwise runs off the end of the container to
        // whatever's next in the document — including, for a modal,
        // elements on the screen behind it.
        const forward = !event.shiftKey;
        const nextIndex =
          currentIndex === -1
            ? 0
            : forward
              ? (currentIndex + 1) % items.length
              : (currentIndex - 1 + items.length) % items.length;
        event.preventDefault();
        event.stopPropagation();
        items[nextIndex].focus();
        return;
      }

      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }

      const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
      const delta = forward ? 1 : -1;
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + delta + items.length) % items.length;

      event.preventDefault();
      event.stopPropagation();
      items[nextIndex].focus();
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return containerRef;
}
