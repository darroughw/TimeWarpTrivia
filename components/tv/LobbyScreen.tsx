"use client";

import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import { DECADES } from "@/lib/mockData";
import type { Decade, DecadeId, Player } from "@/lib/types";
import DecadeFilter from "./DecadeFilter";
import PlayerAvatar from "./PlayerAvatar";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./LobbyScreen.module.scss";

interface LobbyScreenProps {
  roomCode: string;
  players: Player[];
  selectedDecade: DecadeId;
  onSelectDecade: (id: DecadeId) => void;
  onStartGame: () => void;
  // Defaults to the hardcoded mock list — MockTvFlow relies on that
  // default and passes nothing; LiveTvFlow passes real, DB-fetched decades.
  decades?: Decade[];
}

export default function LobbyScreen({
  roomCode,
  players,
  selectedDecade,
  onSelectDecade,
  onStartGame,
  decades = DECADES,
}: LobbyScreenProps) {
  const containerRef = useDpadNavigation<HTMLDivElement>();

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
          <span className={styles.code}>{roomCode}</span>
        </div>
      </header>

      <div className={styles.body}>
        <section className={styles.playersPanel}>
          <h2 className={styles.sectionLabel}>Players in the room</h2>
          <div className={styles.playerGrid}>
            {players.length === 0 && (
              <p className={styles.empty}>Waiting for the first player to join…</p>
            )}
            {players.map((player) => (
              <div key={player.id} className={styles.playerChip}>
                <PlayerAvatar player={player} size="md" showName />
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.sidebar}>
          <h2 className={styles.sectionLabel}>Decade filter</h2>
          <DecadeFilter decades={decades} selectedId={selectedDecade} onSelect={onSelectDecade} />
        </aside>
      </div>

      <footer className={styles.footer}>
        <span className={styles.countLabel} aria-live="polite">
          <strong>{players.length}</strong> player{players.length === 1 ? "" : "s"} joined
        </span>
        <button
          type="button"
          data-dpad-focusable
          className={styles.startButton}
          disabled={players.length === 0}
          onClick={onStartGame}
        >
          Start Game
        </button>
      </footer>
    </div>
  );
}
