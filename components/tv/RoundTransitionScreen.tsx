"use client";

import { useMemo, type CSSProperties } from "react";
import { pickTaunt } from "@/lib/taunts";
import { OPTION_LETTERS, type Player, type RoundResult } from "@/lib/types";
import PlayerAvatar from "./PlayerAvatar";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./RoundTransitionScreen.module.scss";

interface RoundTransitionScreenProps {
  result: RoundResult;
  players: Player[];
}

export default function RoundTransitionScreen({ result, players }: RoundTransitionScreenProps) {
  const { question, results, nextRoundLabel } = result;
  // Re-rolled once per question resolution (keyed on `result`, which is
  // stable until the next question), not on every re-render — `players` is
  // a fresh array from the parent on every render, so including it here
  // would re-roll the target/line continuously while this screen sits on
  // screen (TIM-13: randomize between questions, not while one is showing).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const taunt = useMemo(() => pickTaunt(players), [result]);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <h1 className={styles.eyebrow}>Correct Answer</h1>
      <div className={styles.answerCard}>
        <span className={styles.answerLetter}>{OPTION_LETTERS[question.correctIndex]}</span>
        <span className={styles.answerText}>{question.options[question.correctIndex]}</span>
      </div>

      <div className={styles.resultsGrid}>
        {results.map((pointResult, index) => {
          const player = players.find((p) => p.id === pointResult.playerId);
          if (!player) return null;
          return (
            <div
              // Keyed on question + player, not just player, so the reveal
              // animations below replay on every question instead of only
              // the first time a given player's row ever mounts.
              key={`${question.id}-${pointResult.playerId}`}
              className={`${styles.resultCard} ${pointResult.correct ? styles.correct : ""}`}
              style={{ "--result-index": index } as CSSProperties}
            >
              <PlayerAvatar player={player} size="sm" showName={false} />
              <div className={styles.resultInfo}>
                <span className={styles.resultName}>{player.name}</span>
                <span
                  className={`${styles.resultPoints} ${
                    pointResult.pointsGained > 0 ? styles.gained : styles.zero
                  }`}
                >
                  {pointResult.pointsGained > 0 ? `+${pointResult.pointsGained}` : "+0"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <footer className={styles.footer}>
        {taunt ? (
          <span className={styles.taunt}>{taunt}</span>
        ) : (
          <span />
        )}
        <div className={styles.nextUp}>
          <span className={styles.nextLabel}>Up next</span>
          <span className={styles.nextRound}>{nextRoundLabel}</span>
        </div>
      </footer>
    </div>
  );
}
