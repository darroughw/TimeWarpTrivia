import { rankedByScore } from "@/lib/mockData";
import type { Player } from "@/lib/types";
import PlayerAvatar from "./PlayerAvatar";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./ScoreboardScreen.module.scss";

interface ScoreboardScreenProps {
  players: Player[];
  roundLabel: string;
}

export default function ScoreboardScreen({ players, roundLabel }: ScoreboardScreenProps) {
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
          <li key={player.id} className={`${styles.row} ${index === 0 ? styles.first : ""}`}>
            <span className={styles.rank}>{index + 1}</span>
            <div className={styles.player}>
              <PlayerAvatar player={player} size="sm" showName={false} />
              <span className={styles.name}>{player.name}</span>
            </div>
            <span className={styles.score}>{player.score.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
