"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/types";
import CountdownRing from "./CountdownRing";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./QuestionScreen.module.scss";

interface QuestionScreenProps {
  question: Question;
  totalPlayers: number;
  onTimeUp: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export default function QuestionScreen({ question, totalPlayers, onTimeUp }: QuestionScreenProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(question.timeLimitSeconds);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Countdown tick.
  useEffect(() => {
    setSecondsRemaining(question.timeLimitSeconds);
    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [question]);

  useEffect(() => {
    if (secondsRemaining === 0) onTimeUp();
  }, [secondsRemaining, onTimeUp]);

  // Simulate players answering in on their phones as time passes.
  useEffect(() => {
    setAnsweredCount(0);
    let cancelled = false;

    for (let i = 0; i < totalPlayers; i += 1) {
      const delay = 600 + Math.random() * (question.timeLimitSeconds * 700);
      window.setTimeout(() => {
        if (cancelled) return;
        setAnsweredCount((current) => Math.min(totalPlayers, current + 1));
      }, delay);
    }

    return () => {
      cancelled = true;
    };
  }, [question, totalPlayers]);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <header className={styles.header}>
        <div>
          <span className={styles.roundLabel}>{question.roundLabel}</span>
          <h1 className={styles.questionText}>{question.text}</h1>
        </div>
        <CountdownRing totalSeconds={question.timeLimitSeconds} secondsRemaining={secondsRemaining} />
      </header>

      <div className={styles.main}>
        <div className={styles.options}>
          {question.options.map((option, index) => (
            <div className={styles.option} key={option}>
              <span className={styles.optionLetter}>{OPTION_LETTERS[index]}</span>
              <span className={styles.optionText}>{option}</span>
            </div>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <span className={styles.answeredLabel}>
          <strong>{answeredCount}</strong> of {totalPlayers} players answered
        </span>
        <div className={styles.progressBarTrack} aria-hidden="true">
          <div
            className={styles.progressBarFill}
            style={{ width: `${totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
