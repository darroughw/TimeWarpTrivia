"use client";

import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import type { FinalStanding } from "@/lib/types";
import LogoFooter from "./LogoFooter";
import styles from "./FinalResultsScreen.module.scss";

interface FinalResultsScreenProps {
  standing: FinalStanding;
  onLeave: () => void;
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = n % 100;
  return `${n}${suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]}`;
}

export default function FinalResultsScreen({ standing, onLeave }: FinalResultsScreenProps) {
  const { playerName, rank, totalPlayers, score, winnerName, winnerScore } = standing;
  const isWinner = rank === 1;

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <h1 className={styles.eyebrow}>Game Over</h1>

      {MEDALS[rank] && (
        <div className={styles.medal} aria-hidden="true">
          {MEDALS[rank]}
        </div>
      )}
      <div className={styles.rank}>
        {ordinal(rank)} of {totalPlayers}
      </div>
      <p className={styles.playerName}>{playerName}</p>
      <div className={styles.score}>{score.toLocaleString()} pts</div>

      <p className={styles.comparison}>
        {isWinner
          ? "You won. Every decade, no contest."
          : `${winnerName} won with ${winnerScore.toLocaleString()} pts. ${(
              winnerScore - score
            ).toLocaleString()} to go next time.`}
      </p>

      <p className={styles.rematchNote}>Rematch is the host&rsquo;s call. Hang tight, or leave.</p>

      <button type="button" className={styles.leaveButton} onClick={onLeave}>
        Leave Game
      </button>

      <LogoFooter />
    </div>
  );
}
