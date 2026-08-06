"use client";

import { useEffect } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import styles from "./AnsweredScreen.module.scss";

interface AnsweredScreenProps {
  pickedLetter: string;
  // Only used by the scripted mock flow. The live flow leaves this unset —
  // it re-renders based on the room's real status over Realtime instead.
  onRoundEnd?: () => void;
}

const AUTO_ADVANCE_DELAY_MS = 3000;

export default function AnsweredScreen({ pickedLetter, onRoundEnd }: AnsweredScreenProps) {
  useEffect(() => {
    if (!onRoundEnd) return;
    const timer = window.setTimeout(onRoundEnd, AUTO_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [onRoundEnd]);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div className={styles.check} aria-hidden="true">
        ✓
      </div>
      <h1 className={styles.title}>
        Answer locked in: <span className={styles.pickedLetter}>{pickedLetter}</span>
      </h1>
      <p className={styles.status}>Waiting for other players…</p>
    </div>
  );
}
