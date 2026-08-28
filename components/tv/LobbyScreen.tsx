"use client";

import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import HelpButton from "@/components/shared/HelpButton";
import { DECADES } from "@/lib/mockData";
import type { Decade, DecadeId, Player } from "@/lib/types";
import DecadeFilter from "./DecadeFilter";
import PlayerAvatar from "./PlayerAvatar";
import RemovePlayerButton from "./RemovePlayerButton";
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
  // Left undefined, no remove control renders at all — MockTvFlow has no
  // backend to actually remove anyone against (TIM-35).
  onRemovePlayer?: (playerId: string) => void;
}

export default function LobbyScreen({
  roomCode,
  players,
  selectedDecade,
  onSelectDecade,
  onStartGame,
  decades = DECADES,
  onRemovePlayer,
}: LobbyScreenProps) {
  const containerRef = useDpadNavigation<HTMLDivElement>();
  const activeCount = players.filter((p) => p.status === "active").length;

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
          <img src="/logo.svg" alt="TimeWarp Trivia" className={styles.logo} />
          <h1 className={styles.title}>Grab your phone &amp; join in</h1>
        </div>
        <div className={styles.codeBlock}>
          <span className={styles.codeLabel}>Room Code</span>
          <span className={styles.code}>{roomCode}</span>
          <span className={styles.joinHint}>Join at timewarptrivia.com/play</span>
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
          <h2 className={styles.sectionLabel}>Decade filter</h2>
          <DecadeFilter decades={decades} selectedId={selectedDecade} onSelect={onSelectDecade} />
        </aside>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.countLabel} aria-live="polite">
            <strong>{activeCount}</strong> player{activeCount === 1 ? "" : "s"} joined
          </span>
          <HelpButton />
        </div>
        <div className={styles.startArea}>
          {activeCount < 2 && (
            <span className={styles.startHint} aria-live="polite">
              Need 2 players to start
            </span>
          )}
          <button
            type="button"
            data-dpad-focusable
            className={styles.startButton}
            disabled={activeCount < 2}
            onClick={onStartGame}
          >
            Start Game
          </button>
        </div>
      </footer>
    </div>
  );
}
