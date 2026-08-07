"use client";

import { useEffect } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { OPTION_LETTERS, type Question } from "@/lib/types";
import LogoFooter from "./LogoFooter";
import styles from "./BlockedSpectatorScreen.module.scss";

interface BlockedSpectatorScreenProps {
  question: Question;
  // Only used by the scripted mock flow — see AnsweredScreen for why.
  onRoundEnd?: () => void;
}

const AUTO_ADVANCE_DELAY_MS = 4000;

export default function BlockedSpectatorScreen({ question, onRoundEnd }: BlockedSpectatorScreenProps) {
  useEffect(() => {
    if (!onRoundEnd) return;
    const timer = window.setTimeout(onRoundEnd, AUTO_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [onRoundEnd]);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div className={styles.banner}>
        <span aria-hidden="true">👀</span> The last-place player is answering this one solo. Sit
        back and watch
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

      <LogoFooter />
    </div>
  );
}
