"use client";

import { useEffect, useRef } from "react";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

// Global listener for the classic Konami code (↑↑↓↓←→←→BA) — unlocks the
// hidden portfolio-demo simulator on /host. Ignored while a text field has
// focus so typing a room code or player name can't accidentally trip it.
// Calling onUnlock more than once (e.g. entering the code twice) is
// harmless — the caller just re-sets already-true state.
export function useKonamiCode(onUnlock: () => void): void {
  const bufferRef = useRef<string[]>([]);
  const onUnlockRef = useRef(onUnlock);

  useEffect(() => {
    onUnlockRef.current = onUnlock;
  }, [onUnlock]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const next = [...bufferRef.current, key].slice(-KONAMI_SEQUENCE.length);
      bufferRef.current = next;

      if (next.length === KONAMI_SEQUENCE.length && next.every((k, i) => k === KONAMI_SEQUENCE[i])) {
        bufferRef.current = [];
        onUnlockRef.current();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
