"use client";

import { useEffect } from "react";
import PlayerAvatar from "@/components/tv/PlayerAvatar";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { getAvatarForName } from "@/lib/avatar";
import LogoFooter from "./LogoFooter";
import styles from "./WaitingScreen.module.scss";

interface WaitingScreenProps {
  playerName: string;
  roomCode: string;
  message?: string;
  // Only used by the scripted mock flow, which has no real "host started"
  // event to listen for. The live flow leaves this unset — it re-renders
  // this screen (or not) based on the room's real status over Realtime.
  onHostStart?: () => void;
}

const AUTO_START_DELAY_MS = 3000;

export default function WaitingScreen({
  playerName,
  roomCode,
  message = "Waiting for the host to start",
  onHostStart,
}: WaitingScreenProps) {
  const { emoji, color } = getAvatarForName(playerName);

  useEffect(() => {
    if (!onHostStart) return;
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
        <span>{message}</span>
        <span className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </div>

      <LogoFooter />
    </div>
  );
}
