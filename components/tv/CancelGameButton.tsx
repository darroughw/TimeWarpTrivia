"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CancelGameButton.module.scss";

interface CancelGameButtonProps {
  onConfirm: () => void;
}

const CONFIRM_WINDOW_MS = 3000;

/**
 * Two presses, same button — same arm-then-confirm pattern as
 * RemovePlayerButton (TIM-35), applied to ending this room entirely and
 * handing the TV to a brand-new room/code (TIM-38). A dedicated
 * component rather than a generalized shared one — different label set,
 * lower risk than reshaping RemovePlayerButton's existing API.
 */
export default function CancelGameButton({ onConfirm }: CancelGameButtonProps) {
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
      aria-label={armed ? "Confirm canceling this game" : "Cancel game and start a new room"}
      onClick={handleClick}
      onBlur={disarm}
    >
      {armed ? "Confirm?" : "Cancel Game"}
    </button>
  );
}
