"use client";

import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { OPTION_LETTERS, type Player, type Question } from "@/lib/types";
import CountdownRing from "./CountdownRing";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./QuestionScreen.module.scss";

interface QuestionScreenProps {
  question: Question;
  totalPlayers: number;
  onTimeUp: () => void;
  // When set, this is a solo round — only this player can answer, and the
  // footer/simulation reflect a single answerer instead of the whole room.
  soloPlayer?: Player;
  // When provided (the live, Supabase-backed flow), this is the real count
  // of submitted answers and the internal simulation is skipped entirely.
  // Left undefined, the mock flow simulates players answering over time.
  answeredCount?: number;
}

export default function QuestionScreen({
  question,
  totalPlayers,
  onTimeUp,
  soloPlayer,
  answeredCount: liveAnsweredCount,
}: QuestionScreenProps) {
  const [simulatedAnsweredCount, setSimulatedAnsweredCount] = useState(0);
  const effectiveTotal = soloPlayer ? 1 : totalPlayers;
  const isLive = liveAnsweredCount !== undefined;
  const answeredCount = isLive ? liveAnsweredCount : simulatedAnsweredCount;

  // Two different things can end the question early — the clock running
  // out, or every player already having locked in an answer — and either
  // one should only ever call onTimeUp once. hasFiredRef is shared by both
  // paths below and reset per question.
  const hasFiredRef = useRef(false);
  useEffect(() => {
    hasFiredRef.current = false;
  }, [question.id]);

  function fireTimeUpOnce() {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    onTimeUp();
  }

  const secondsRemaining = useCountdown(question.timeLimitSeconds, question.id, fireTimeUpOnce);

  // Nobody left to wait on — don't burn the rest of the clock.
  // fireTimeUpOnce is a plain function, recreated every render — adding it
  // here would refire this effect on every render instead of only when
  // answeredCount/effectiveTotal actually change; hasFiredRef inside it
  // already guards against calling onTimeUp more than once regardless.
  useEffect(() => {
    if (effectiveTotal > 0 && answeredCount >= effectiveTotal) fireTimeUpOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answeredCount, effectiveTotal]);

  // Simulate players answering in on their phones as time passes — only
  // for the mock flow. The live flow passes real counts via `answeredCount`.
  useEffect(() => {
    if (isLive) return;
    setSimulatedAnsweredCount(0);
    let cancelled = false;

    for (let i = 0; i < effectiveTotal; i += 1) {
      const delay = 600 + Math.random() * (question.timeLimitSeconds * 700);
      window.setTimeout(() => {
        if (cancelled) return;
        setSimulatedAnsweredCount((current) => Math.min(effectiveTotal, current + 1));
      }, delay);
    }

    return () => {
      cancelled = true;
    };
  }, [question, effectiveTotal, isLive]);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <header className={styles.header}>
        <div>
          {soloPlayer && (
            <div className={styles.soloBanner}>
              <span aria-hidden="true">⚡</span> Solo round — only {soloPlayer.name} can answer
            </div>
          )}
          <span className={styles.roundLabel}>{question.roundLabel}</span>
          <h1 className={styles.questionText}>{question.text}</h1>
        </div>
        <CountdownRing
          totalSeconds={question.timeLimitSeconds}
          secondsRemaining={secondsRemaining}
          pointsMultiplier={question.pointsMultiplier}
        />
      </header>

      <div className={styles.main}>
        <div className={styles.options}>
          {question.options.map((option, index) => (
            <div className={styles.option} key={index}>
              <span className={styles.optionLetter}>{OPTION_LETTERS[index]}</span>
              <span className={styles.optionText}>{option}</span>
            </div>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <span className={styles.answeredLabel} aria-live="polite">
          {soloPlayer ? (
            answeredCount > 0 ? (
              <>{soloPlayer.name} has answered</>
            ) : (
              <>Waiting for {soloPlayer.name}&hellip;</>
            )
          ) : (
            <>
              <strong>{answeredCount}</strong> of {totalPlayers} players answered
            </>
          )}
        </span>
        <div className={styles.progressBarTrack} aria-hidden="true">
          <div
            className={styles.progressBarFill}
            style={{ width: `${effectiveTotal > 0 ? (answeredCount / effectiveTotal) * 100 : 0}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
