"use client";

import { useEffect, useRef, useState } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import type { Question } from "@/lib/types";
import styles from "./QuestionScreen.module.scss";

interface QuestionScreenProps {
  question: Question;
  onAnswer: (index: number) => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const LOCK_IN_DELAY_MS = 400;

export default function QuestionScreen({ question, onAnswer }: QuestionScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const lockInTimer = useRef<number>();

  useEffect(() => () => window.clearTimeout(lockInTimer.current), []);

  function handleSelect(index: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    lockInTimer.current = window.setTimeout(() => onAnswer(index), LOCK_IN_DELAY_MS);
  }

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div>
        <span className={styles.roundLabel}>{question.roundLabel}</span>
        <h1 className={styles.questionText}>{question.text}</h1>
      </div>

      <div className={styles.options}>
        {question.options.map((option, index) => (
          <button
            key={index}
            type="button"
            className={`${styles.option} ${selectedIndex === index ? styles.selected : ""}`}
            disabled={selectedIndex !== null}
            onClick={() => handleSelect(index)}
          >
            <span className={styles.optionLetter}>{OPTION_LETTERS[index]}</span>
            <span className={styles.optionText}>{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
