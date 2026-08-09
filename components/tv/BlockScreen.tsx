import type { CSSProperties } from "react";
import { DECADE_COLORS } from "@/lib/decadeColors";
import { pickBlockChooser } from "@/lib/mockData";
import type { Player, Question } from "@/lib/types";
import LoadingState from "@/components/shared/LoadingState";
import PlayerAvatar from "./PlayerAvatar";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./BlockScreen.module.scss";

interface BlockScreenProps {
  players: Player[];
  candidates: Question[];
}

// Purely a display — the lowest scorer makes this choice on their phone.
// The TV just shows the room who's choosing and what they're choosing from.
export default function BlockScreen({ players, candidates }: BlockScreenProps) {
  const chooser = pickBlockChooser(players);
  // Only reachable if every player has been removed mid-game — min 2 to
  // start makes it vanishingly unlikely, but this beats crashing on
  // chooser.name.
  if (!chooser) return <LoadingState message="Waiting for a player…" />;

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div>
        <span className={styles.eyebrow}>Before the Final Round</span>
        <h1 className={styles.title}>
          <span className={styles.highlight}>{chooser.name}</span> is in last place and is
          picking one question to answer alone.
        </h1>
      </div>

      <div className={styles.main}>
        <div className={styles.chooser}>
          <span className={styles.chooserBadge}>Last Place</span>
          <PlayerAvatar player={chooser} size="lg" showScore />
        </div>

        <div className={styles.candidates}>
          {candidates.map((candidate) => {
            // Deep Cuts questions (TIM-41) have no decade — every
            // candidate in a Deep Cuts game shares the same topic
            // anyway, so a per-candidate tag would be redundant even
            // if there were a color to show.
            const style = candidate.decadeId
              ? ({ "--decade-color": DECADE_COLORS[candidate.decadeId] } as CSSProperties)
              : undefined;
            return (
              <div className={styles.candidate} key={candidate.id} style={style}>
                {candidate.decadeId && <span className={styles.decadeTag}>{candidate.decadeId}</span>}
                <span className={styles.candidateText}>{candidate.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <footer className={styles.footer}>
        <p className={styles.rule}>
          Whichever one they pick, <strong>only {chooser.name} can answer it</strong>. Everyone
          else sits this one out. Correct and fast still scores full points.
        </p>
      </footer>
    </div>
  );
}
