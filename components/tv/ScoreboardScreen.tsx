import { rankedByScore } from "@/lib/mockData";
import type { Player } from "@/lib/types";
import PlayerAvatar from "./PlayerAvatar";
import RemovePlayerButton from "./RemovePlayerButton";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./ScoreboardScreen.module.scss";

interface ScoreboardScreenProps {
  players: Player[];
  roundLabel: string;
  // Left undefined, no remove control renders — MockTvFlow has no backend
  // to actually remove anyone against (TIM-35).
  onRemovePlayer?: (playerId: string) => void;
}

export default function ScoreboardScreen({ players, roundLabel, onRemovePlayer }: ScoreboardScreenProps) {
  const ranked = rankedByScore(players);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div>
        <span className={styles.eyebrow}>Standings after {roundLabel}</span>
        <h1 className={styles.title}>Scoreboard</h1>
      </div>

      <ol className={styles.list}>
        {ranked.map((player, index) => (
          <li
            key={player.id}
            className={`${styles.row} ${index === 0 ? styles.first : ""} ${
              player.status === "left" ? styles.left : ""
            }`}
          >
            <span className={styles.rank}>{index + 1}</span>
            <div className={styles.player}>
              <PlayerAvatar player={player} size="sm" showName={false} />
              <span className={styles.name}>{player.name}</span>
            </div>
            <span className={styles.score}>{player.score.toLocaleString()}</span>
            {onRemovePlayer &&
              (player.status === "active" ? (
                <RemovePlayerButton playerName={player.name} onConfirm={() => onRemovePlayer(player.id)} />
              ) : (
                <span className={styles.leftBadge}>Removed</span>
              ))}
          </li>
        ))}
      </ol>
    </div>
  );
}
