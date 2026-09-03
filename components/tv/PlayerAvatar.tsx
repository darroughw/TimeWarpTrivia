import type { CSSProperties } from "react";
import type { Player } from "@/lib/types";
import styles from "./PlayerAvatar.module.scss";

interface PlayerAvatarProps {
  player: Player;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  showScore?: boolean;
  rank?: number;
  // Swaps the player's own color ring for a gold medal ring, regardless of
  // that player's color — used for the game's actual winner (EndGameScreen)
  // so 1st place reads as "the winner" at a glance, not just "however this
  // player happens to be colored."
  isWinner?: boolean;
}

export default function PlayerAvatar({
  player,
  size = "md",
  showName = true,
  showScore = false,
  rank,
  isWinner = false,
}: PlayerAvatarProps) {
  const style = { "--player-color": player.color } as CSSProperties;

  return (
    <div className={styles.wrap} style={style}>
      {rank !== undefined && <span className={styles.rank}>#{rank}</span>}
      <div className={`${styles.ring} ${styles[size]} ${isWinner ? styles.winner : ""}`} aria-hidden="true">
        {player.emoji}
      </div>
      {showName && (
        <span className={styles.name}>
          {player.name}
        </span>
      )}
      {showScore && <span className={styles.score}>{player.score.toLocaleString()} pts</span>}
    </div>
  );
}
