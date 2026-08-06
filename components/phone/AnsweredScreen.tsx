"use client";

import { useEffect } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import styles from "./AnsweredScreen.module.scss";

interface AnsweredScreenProps {
  pickedLetter: string;
  onRoundEnd: () => void;
}

const AUTO_ADVANCE_DELAY_MS = 3000;

export default function AnsweredScreen({ pickedLetter, onRoundEnd }: AnsweredScreenProps) {
  // Stands in for the realtime "round over" event once everyone's answered.
  useEffect(() => {
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
