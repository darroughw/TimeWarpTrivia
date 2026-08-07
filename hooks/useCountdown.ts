"use client";

import { useEffect, useRef, useState } from "react";

// Ticks totalSeconds down to 0 once per second, resetting whenever
// resetKey changes (not totalSeconds — two consecutive questions can
// share the same time limit, and the countdown still needs to restart).
// Shared by the TV's and phone's QuestionScreen so both tick in lockstep
// off the same logic.
export function useCountdown(totalSeconds: number, resetKey: string, onTimeUp?: () => void): number {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);

  useEffect(() => {
    setSecondsRemaining(totalSeconds);
    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [resetKey]);

  // onTimeUp is re-created every render by both flows (their closures
  // capture room/answer state, so they can't be memoized away). Keeping
  // only the latest one in a ref means the effect below depends on
  // secondsRemaining alone — otherwise, once secondsRemaining hits 0,
  // every re-render would put a *new* onTimeUp in the dependency array,
  // re-fire the effect, and call onTimeUp again. Infinite loop.
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (secondsRemaining === 0) onTimeUpRef.current?.();
  }, [secondsRemaining]);

  return secondsRemaining;
}
