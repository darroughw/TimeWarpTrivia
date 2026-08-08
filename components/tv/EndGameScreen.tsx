"use client";

import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import { rankedByScore } from "@/lib/mockData";
import type { Player } from "@/lib/types";
import CancelGameButton from "./CancelGameButton";
import PlayerAvatar from "./PlayerAvatar";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./EndGameScreen.module.scss";

interface EndGameScreenProps {
  players: Player[];
  onPlayAgain: () => void;
  // Left undefined, no Cancel Game control renders at all — MockTvFlow
  // has no real room/code to cancel out of (same pattern as
  // LobbyScreen's onRemovePlayer, TIM-35).
  onCancelGame?: () => void;
}

const PODIUM_CLASS = [styles.first, styles.second, styles.third];

export default function EndGameScreen({ players, onPlayAgain, onCancelGame }: EndGameScreenProps) {
  const ranked = rankedByScore(players);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const containerRef = useDpadNavigation<HTMLDivElement>();

  return (
    <div className={styles.screen} ref={containerRef}>
      <ScanlineOverlay />
      <div>
        <span className={styles.eyebrow}>Game Over</span>
        <h1 className={styles.title}>Final Results</h1>
      </div>

      <div className={styles.podium}>
        {podium.map((player, index) => (
          <div key={player.id} className={`${styles.podiumSpot} ${PODIUM_CLASS[index]}`}>
            <PlayerAvatar player={player} size="lg" showScore />
            <div className={styles.podiumBlock}>
              <span className={styles.place}>{index + 1}</span>
            </div>
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className={styles.rest}>
          {rest.map((player, index) => (
            <div key={player.id} className={styles.restRow}>
              <span>
                <span className={styles.restRank}>#{index + 4}</span>
                {player.name}
              </span>
              <span className={styles.restScore}>{player.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" data-dpad-focusable className={styles.playAgainButton} onClick={onPlayAgain}>
          Play Again
        </button>
        {onCancelGame && <CancelGameButton onConfirm={onCancelGame} />}
      </div>
    </div>
  );
}
