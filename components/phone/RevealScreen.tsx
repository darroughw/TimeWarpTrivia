"use client";

import { useEffect, useState } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { OPTION_LETTERS, type Question } from "@/lib/types";
import LogoFooter from "./LogoFooter";
import styles from "./RevealScreen.module.scss";

export type RevealOutcome = "correct" | "wrong" | "missed";

interface RevealScreenProps {
  outcome: RevealOutcome;
  question: Question;
  pointsGained: number;
  // Consecutive correct answers including this one — 0 unless correct.
  streak: number;
  // Only used by the scripted mock flow; the live flow re-renders off the
  // room's real status instead.
  onDone?: () => void;
}

const COUNT_UP_MS = 700;
const AUTO_ADVANCE_DELAY_MS = 3500;
const STREAK_MIN = 2;

const HEADLINES: Record<RevealOutcome, string[]> = {
  correct: ["Correct!", "Nailed it!", "Big brain!", "Totally tubular!"],
  wrong: ["Not quite", "Oof.", "So close", "Bummer"],
  missed: ["Time's up!"],
};

// Fixed rather than random per render, so the burst doesn't reshuffle if
// the screen re-renders mid-animation.
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 6) * 0.07}s`,
  duration: `${1.6 + (i % 5) * 0.2}s`,
  spin: `${(i % 2 ? 1 : -1) * (180 + i * 40)}deg`,
}));

function useCountUp(target: number): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target === 0) {
      setValue(target);
      return;
    }
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

export default function RevealScreen({ outcome, question, pointsGained, streak, onDone }: RevealScreenProps) {
  const [headline] = useState(() => {
    const options = HEADLINES[outcome];
    return options[Math.floor(Math.random() * options.length)];
  });
  const points = useCountUp(pointsGained);
  const correctLetter = OPTION_LETTERS[question.correctIndex];

  useEffect(() => {
    if (!onDone) return;
    const timer = window.setTimeout(onDone, AUTO_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`${styles.screen} ${styles[outcome]}`}>
      <ScanlineOverlay />

      {outcome === "correct" && (
        <div className={styles.confetti} aria-hidden="true">
          {CONFETTI.map((piece, i) => (
            <span
              key={i}
              className={styles.piece}
              style={
                {
                  left: piece.left,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration,
                  "--spin": piece.spin,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className={styles.badge} aria-hidden="true">
        {outcome === "correct" ? "✓" : outcome === "wrong" ? "✗" : "⏰"}
      </div>

      <h1 className={styles.headline}>{headline}</h1>

      <div className={styles.points}>+{points}</div>

      {outcome === "correct" && streak >= STREAK_MIN && (
        <div className={styles.streak}>🔥 {streak} in a row</div>
      )}

      {outcome !== "correct" && (
        <p className={styles.answer}>
          The answer was{" "}
          <span className={styles.answerLetter} data-letter={correctLetter}>
            {correctLetter}
          </span>
          : {question.options[question.correctIndex]}
        </p>
      )}

      <p className={styles.hint}>Check the TV for the full results</p>

      <LogoFooter />
    </div>
  );
}
