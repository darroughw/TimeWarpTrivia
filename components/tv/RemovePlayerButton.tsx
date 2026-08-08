"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./RemovePlayerButton.module.scss";

interface RemovePlayerButtonProps {
  playerName: string;
  onConfirm: () => void;
}

const CONFIRM_WINDOW_MS = 3000;

/**
 * Two presses, same button, same spot — no layout reflow to fit a
 * confirm dialog into whatever row this sits in (a tight lobby chip or a
 * scoreboard line). First press arms it and swaps the label to
 * "Confirm?"; a second press within the window actually removes.
 * Disarms itself after the window, or immediately on blur, so a D-pad
 * user who arms it and navigates away doesn't leave a live "remove" one
 * keypress away for whoever's focused there next (TIM-35).
 */
export default function RemovePlayerButton({ playerName, onConfirm }: RemovePlayerButtonProps) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<number>();

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function disarm() {
    window.clearTimeout(timerRef.current);
    setArmed(false);
  }

  function handleClick() {
    if (armed) {
      disarm();
      onConfirm();
      return;
    }
    setArmed(true);
    timerRef.current = window.setTimeout(disarm, CONFIRM_WINDOW_MS);
  }

  return (
    <button
      type="button"
      data-dpad-focusable
      className={`${styles.button} ${armed ? styles.armed : ""}`}
      aria-label={armed ? `Confirm removing ${playerName}` : `Remove ${playerName}`}
      onClick={handleClick}
      onBlur={disarm}
    >
      {armed ? "Confirm?" : "Remove"}
    </button>
  );
}
