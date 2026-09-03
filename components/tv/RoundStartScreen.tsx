"use client";

import { useEffect, useState } from "react";
import { playSound } from "@/lib/sounds";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./RoundStartScreen.module.scss";

interface RoundStartScreenProps {
  roundLabel: string;
  secondsRemaining: number;
}

// One deadpan line per countdown, picked once per mount rather than
// per-render — see CLAUDE.md's tone/voice guidance on randomizing
// transition copy so it doesn't repeat identically every playthrough.
const READY_LINES = [
  "Try to keep up.",
  "Same rules, higher stakes.",
  "No pressure. Okay, some pressure.",
  "Everyone already forgot everything.",
  "Here we go again.",
];

// "Same rules, higher stakes" implies a previous round to raise the
// stakes from — nonsensical on Round 1's countdown, which has nothing
// before it. Excluded from that round's pool only; every other line still
// works on Round 1.
const FIRST_ROUND_READY_LINES = READY_LINES.filter((line) => line !== "Same rules, higher stakes.");

export default function RoundStartScreen({ roundLabel, secondsRemaining }: RoundStartScreenProps) {
  const [readyLine] = useState(() => {
    const pool = roundLabel === "Round 1" ? FIRST_ROUND_READY_LINES : READY_LINES;
    return pool[Math.floor(Math.random() * pool.length)];
  });

  // Fires right as the countdown hits 0 and the room's about to swap to
  // the question status — a beat before this screen actually unmounts,
  // since the status transition round-trips through Realtime.
  useEffect(() => {
    if (secondsRemaining === 0) playSound("whoosh");
  }, [secondsRemaining]);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <span className={styles.eyebrow}>{readyLine}</span>
      <h1 className={styles.roundLabel}>{roundLabel}</h1>
      <div className={styles.count} aria-hidden="true">
        {secondsRemaining}
      </div>
    </div>
  );
}
