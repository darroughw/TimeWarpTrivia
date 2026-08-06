"use client";

import { useState } from "react";
import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import { rankedByScore } from "@/lib/mockData";
import type { Player } from "@/lib/types";
import PlayerAvatar from "./PlayerAvatar";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./BlockScreen.module.scss";

interface BlockScreenProps {
  players: Player[];
  onConfirm: (targetId: string) => void;
}

export default function BlockScreen({ players, onConfirm }: BlockScreenProps) {
  const ranked = rankedByScore(players);
  const chooser = ranked[ranked.length - 1];
  const targets = players.filter((p) => p.id !== chooser.id);

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const containerRef = useDpadNavigation<HTMLDivElement>();

  return (
    <div className={styles.screen} ref={containerRef}>
      <ScanlineOverlay />
      <div>
        <span className={styles.eyebrow}>Before the Final Round</span>
        <h1 className={styles.title}>
          <span className={styles.highlight}>{chooser.name}</span> is in last place and gets to
          block one rival from scoring.
        </h1>
      </div>

      <div className={styles.main}>
        <div className={styles.chooser}>
          <span className={styles.chooserBadge}>Last Place</span>
          <PlayerAvatar player={chooser} size="lg" showScore />
        </div>

        <div className={styles.targets} role="radiogroup" aria-label="Block target">
          {targets.map((player) => {
            const selected = player.id === selectedTargetId;
            return (
              <button
                key={player.id}
                type="button"
                data-dpad-focusable
                role="radio"
                aria-checked={selected}
                className={`${styles.target} ${selected ? styles.selected : ""}`}
                onClick={() => setSelectedTargetId(player.id)}
              >
                <PlayerAvatar player={player} size="md" showScore />
              </button>
            );
          })}
        </div>
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          data-dpad-focusable
          className={styles.confirmButton}
          disabled={!selectedTargetId}
          onClick={() => selectedTargetId && onConfirm(selectedTargetId)}
        >
          Confirm Block
        </button>
      </footer>
    </div>
  );
}
