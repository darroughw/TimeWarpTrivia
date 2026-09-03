"use client";

import { useEffect, useRef } from "react";
import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import FeedbackButton from "@/components/shared/FeedbackButton";
import { playSound } from "@/lib/sounds";
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
  const canStart = activeCount >= 2 && selectedTopicId !== null;

  // Chime once per active-player increase — see LobbyScreen's identical
  // logic/comment.
  const prevActiveCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevActiveCountRef.current !== null && activeCount > prevActiveCountRef.current) {
      playSound("join");
    }
    prevActiveCountRef.current = activeCount;
  }, [activeCount]);

  return (
    <div className={styles.screen} ref={containerRef}>
      <ScanlineOverlay />
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the landing page's
              own logo uses next/image, but only for `priority`/explicit-dimensions
              LCP hints that matter on a page Google actually indexes; this route is
              excluded from robots.txt/sitemap.xml (it creates a real room on load),
              so there's no CWV score to protect, and it's still `unoptimized` SVG
              either way. */}
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
