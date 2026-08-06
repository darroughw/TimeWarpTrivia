import type { Player, RoundResult } from "@/lib/types";
import PlayerAvatar from "./PlayerAvatar";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./RoundTransitionScreen.module.scss";

interface RoundTransitionScreenProps {
  result: RoundResult;
  players: Player[];
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export default function RoundTransitionScreen({ result, players }: RoundTransitionScreenProps) {
  const { question, results, nextRoundLabel } = result;

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <span className={styles.eyebrow}>Correct Answer</span>
      <div className={styles.answerCard}>
        <span className={styles.answerLetter}>{OPTION_LETTERS[question.correctIndex]}</span>
        <span className={styles.answerText}>{question.options[question.correctIndex]}</span>
      </div>

      <div className={styles.resultsGrid}>
        {results.map((pointResult) => {
          const player = players.find((p) => p.id === pointResult.playerId);
          if (!player) return null;
          return (
            <div
              key={pointResult.playerId}
              className={`${styles.resultCard} ${pointResult.correct ? styles.correct : ""}`}
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
        <span className={styles.nextLabel}>Up next</span>
        <span className={styles.nextRound}>{nextRoundLabel}</span>
      </footer>
    </div>
  );
}
