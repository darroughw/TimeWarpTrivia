"use client";

import { useEffect, useRef, useState } from "react";
import CountdownRing from "@/components/tv/CountdownRing";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { useCountdown } from "@/hooks/useCountdown";
import { OPTION_LETTERS, type Question } from "@/lib/types";
import LogoFooter from "./LogoFooter";
import styles from "./QuestionScreen.module.scss";

interface QuestionScreenProps {
  question: Question;
  onAnswer: (index: number) => void;
}

const LOCK_IN_DELAY_MS = 400;
// CountdownRing is aria-hidden (a per-second live region would spam a
// screen reader for the whole question) — this is the one deliberate
// exception, a single announcement fired once per question instead of
// going fully silent on the game's core time-pressure mechanic (TIM-46).
const LOW_TIME_ANNOUNCE_SECONDS = 5;

export default function QuestionScreen({ question, onAnswer }: QuestionScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lowTimeAnnouncement, setLowTimeAnnouncement] = useState("");
  const lockInTimer = useRef<number>();
  // Purely presentational — the phone doesn't own the "time's up" state
  // transition (the TV does, via its own identical countdown), so no
  // onTimeUp callback is passed here.
  const secondsRemaining = useCountdown(question.timeLimitSeconds, question.id);

  useEffect(() => () => window.clearTimeout(lockInTimer.current), []);

  useEffect(() => {
    setLowTimeAnnouncement("");
  }, [question.id]);

  useEffect(() => {
    if (secondsRemaining <= LOW_TIME_ANNOUNCE_SECONDS && secondsRemaining > 0 && !lowTimeAnnouncement) {
      setLowTimeAnnouncement(`${LOW_TIME_ANNOUNCE_SECONDS} seconds left — answer now.`);
    }
  }, [secondsRemaining, lowTimeAnnouncement]);

  function handleSelect(index: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    lockInTimer.current = window.setTimeout(() => onAnswer(index), LOCK_IN_DELAY_MS);
  }

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div className={styles.header}>
        <div>
          <span className={styles.roundLabel}>{question.roundLabel}</span>
          <h1 className={styles.questionText}>{question.text}</h1>
        </div>
        <CountdownRing
          totalSeconds={question.timeLimitSeconds}
          secondsRemaining={secondsRemaining}
          pointsMultiplier={question.pointsMultiplier}
          size="sm"
        />
      </div>

      <div className={styles.options} role="radiogroup" aria-label="Answer options">
        {question.options.map((option, index) => (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={selectedIndex === index}
            className={`${styles.option} ${selectedIndex === index ? styles.selected : ""}`}
            disabled={selectedIndex !== null}
            onClick={() => handleSelect(index)}
          >
            <span className={styles.optionLetter}>{OPTION_LETTERS[index]}</span>
            <span className={styles.optionText}>{option}</span>
          </button>
        ))}
      </div>

      <span className={styles.srOnly} aria-live="assertive">
        {lowTimeAnnouncement}
      </span>

      <LogoFooter />
    </div>
  );
}
