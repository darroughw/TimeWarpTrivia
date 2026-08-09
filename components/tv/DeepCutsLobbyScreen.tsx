"use client";

import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import FeedbackButton from "@/components/shared/FeedbackButton";
import type { DeepCutTopic, Player } from "@/lib/types";
import DeepCutTopicFilter from "./DeepCutTopicFilter";
import PlayerAvatar from "./PlayerAvatar";
import RemovePlayerButton from "./RemovePlayerButton";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./DeepCutsLobbyScreen.module.scss";

interface DeepCutsLobbyScreenProps {
  roomCode: string;
  players: Player[];
  selectedTopicId: string | null;
  onSelectTopic: (id: string) => void;
  onStartGame: () => void;
  topics: DeepCutTopic[];
  onRemovePlayer?: (playerId: string) => void;
}

// Structural copy of LobbyScreen (TIM-41) — same player grid / remove /
// room-code chrome — but its own logo, copy, and a topic picker instead
// of a decade filter. No HelpButton: the shared help content is written
// entirely around decade selection and would be actively wrong here.
// FeedbackButton is included instead — Deep Cuts topics are themselves
// user-suggested via that same form (TIM-28), so it's the more relevant
// channel on this screen.
export default function DeepCutsLobbyScreen({
  roomCode,
  players,
  selectedTopicId,
  onSelectTopic,
  onStartGame,
  topics,
  onRemovePlayer,
}: DeepCutsLobbyScreenProps) {
  const containerRef = useDpadNavigation<HTMLDivElement>();
  const activeCount = players.filter((p) => p.status === "active").length;
  const canStart = activeCount > 0 && selectedTopicId !== null;

  return (
    <div className={styles.screen} ref={containerRef}>
      <ScanlineOverlay />
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <img src="/logo-deepcuts.svg" alt="Deep Cuts Trivia" className={styles.logo} />
          <h1 className={styles.title}>Pick a topic, dig in</h1>
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
              <div
                key={player.id}
                className={`${styles.playerChip} ${player.status === "left" ? styles.left : ""}`}
              >
                <PlayerAvatar player={player} size="md" showName />
                {onRemovePlayer &&
                  (player.status === "active" ? (
                    <RemovePlayerButton
                      playerName={player.name}
                      onConfirm={() => onRemovePlayer(player.id)}
                    />
                  ) : (
                    <span className={styles.leftBadge}>Removed</span>
                  ))}
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.sidebar}>
          <h2 className={styles.sectionLabel}>Topic</h2>
          <DeepCutTopicFilter topics={topics} selectedId={selectedTopicId} onSelect={onSelectTopic} />
        </aside>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.countLabel} aria-live="polite">
            <strong>{activeCount}</strong> player{activeCount === 1 ? "" : "s"} joined
          </span>
          <FeedbackButton />
        </div>
        <button
          type="button"
          data-dpad-focusable
          className={styles.startButton}
          disabled={!canStart}
          onClick={onStartGame}
        >
          Start Game
        </button>
      </footer>
    </div>
  );
}
