"use client";

import { useEffect } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import type { Question } from "@/lib/types";
import styles from "./BlockedSpectatorScreen.module.scss";

interface BlockedSpectatorScreenProps {
  question: Question;
  onRoundEnd: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const AUTO_ADVANCE_DELAY_MS = 4000;

export default function BlockedSpectatorScreen({ question, onRoundEnd }: BlockedSpectatorScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onRoundEnd, AUTO_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [onRoundEnd]);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div className={styles.banner}>
        👀 The last-place player is answering this one solo — sit back and watch
      </div>

      <div>
        <span className={styles.roundLabel}>{question.roundLabel}</span>
        <h1 className={styles.questionText}>{question.text}</h1>
      </div>

      <div className={styles.options} aria-hidden="true">
        {question.options.map((option, index) => (
          <div className={styles.option} key={index}>
            <span className={styles.optionLetter}>{OPTION_LETTERS[index]}</span>
            <span className={styles.optionText}>{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
