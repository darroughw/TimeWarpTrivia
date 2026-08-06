"use client";

import { useEffect } from "react";
import PlayerAvatar from "@/components/tv/PlayerAvatar";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { getAvatarForName } from "@/lib/avatar";
import styles from "./WaitingScreen.module.scss";

interface WaitingScreenProps {
  playerName: string;
  roomCode: string;
  onHostStart: () => void;
}

const AUTO_START_DELAY_MS = 3000;

export default function WaitingScreen({ playerName, roomCode, onHostStart }: WaitingScreenProps) {
  const { emoji, color } = getAvatarForName(playerName);

  // Stands in for the realtime "host started the game" event.
  useEffect(() => {
    const timer = window.setTimeout(onHostStart, AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [onHostStart]);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div>
        <span className={styles.roomLabel}>Room</span>
        <div className={styles.roomCode}>{roomCode}</div>
      </div>

      <PlayerAvatar player={{ id: "self", name: playerName, emoji, color, score: 0 }} size="lg" />

      <h1 className={styles.greeting}>You&rsquo;re in, {playerName}!</h1>

      <div className={styles.status}>
        <span>Waiting for the host to start</span>
        <span className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </div>
    </div>
  );
}
