"use client";

import { useState } from "react";
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

export default function RoundStartScreen({ roundLabel, secondsRemaining }: RoundStartScreenProps) {
  const [readyLine] = useState(() => READY_LINES[Math.floor(Math.random() * READY_LINES.length)]);

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
