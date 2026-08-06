"use client";

import { useEffect, useState } from "react";
import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import { DECADES, MOCK_PLAYERS, ROOM_CODE } from "@/lib/mockData";
import type { DecadeId, Player } from "@/lib/types";
import DecadeFilter from "./DecadeFilter";
import PlayerAvatar from "./PlayerAvatar";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./LobbyScreen.module.scss";

interface LobbyScreenProps {
  onStartGame: () => void;
}

const JOIN_INTERVAL_MS = 900;

export default function LobbyScreen({ onStartGame }: LobbyScreenProps) {
  const [joinedPlayers, setJoinedPlayers] = useState<Player[]>([]);
  const [selectedDecade, setSelectedDecade] = useState<DecadeId>("all");
  const containerRef = useDpadNavigation<HTMLDivElement>();

  // Simulate the lobby's live "players joining" feed.
  useEffect(() => {
    setJoinedPlayers([]);
    let cancelled = false;

    MOCK_PLAYERS.forEach((player, index) => {
      window.setTimeout(() => {
        if (cancelled) return;
        setJoinedPlayers((current) => [...current, player]);
      }, JOIN_INTERVAL_MS * (index + 1));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.screen} ref={containerRef}>
      <ScanlineOverlay />
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <span className={styles.eyebrow}>TimeWarp Trivia</span>
          <h1 className={styles.title}>Grab your phone &amp; join in</h1>
        </div>
        <div className={styles.codeBlock}>
          <span className={styles.codeLabel}>Room Code</span>
          <span className={styles.code}>{ROOM_CODE}</span>
        </div>
      </header>

      <div className={styles.body}>
        <section className={styles.playersPanel}>
          <span className={styles.sectionLabel}>Players in the room</span>
          <div className={styles.playerGrid}>
            {joinedPlayers.length === 0 && (
              <p className={styles.empty}>Waiting for the first player to join…</p>
            )}
            {joinedPlayers.map((player) => (
              <div key={player.id} className={styles.playerChip}>
                <PlayerAvatar player={player} size="md" showName />
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.sidebar}>
          <span className={styles.sectionLabel}>Decade filter</span>
          <DecadeFilter decades={DECADES} selectedId={selectedDecade} onSelect={setSelectedDecade} />
        </aside>
      </div>

      <footer className={styles.footer}>
        <span className={styles.countLabel}>
          <strong>{joinedPlayers.length}</strong> of {MOCK_PLAYERS.length} players joined
        </span>
        <button
          type="button"
          data-dpad-focusable
          className={styles.startButton}
          disabled={joinedPlayers.length === 0}
          onClick={onStartGame}
        >
          Start Game
        </button>
      </footer>
    </div>
  );
}
