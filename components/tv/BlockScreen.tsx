import type { CSSProperties } from "react";
import { DECADE_COLORS } from "@/lib/decadeColors";
import { rankedByScore } from "@/lib/mockData";
import type { Player, Question } from "@/lib/types";
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
  const ranked = rankedByScore(players);
  const chooser = ranked[ranked.length - 1];

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
            const style = { "--decade-color": DECADE_COLORS[candidate.decadeId] } as CSSProperties;
            return (
              <div className={styles.candidate} key={candidate.id} style={style}>
                <span className={styles.decadeTag}>{candidate.decadeId}</span>
                <span className={styles.candidateText}>{candidate.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <footer className={styles.footer}>
        <p className={styles.rule}>
          Whichever one they pick, <strong>only {chooser.name} can answer it</strong> — everyone
          else sits this one out. Correct and fast still scores full points.
        </p>
      </footer>
    </div>
  );
}
