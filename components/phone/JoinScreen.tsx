"use client";

import { useState } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import styles from "./JoinScreen.module.scss";

interface JoinScreenProps {
  onJoin: (name: string, roomCode: string) => void;
  error?: string;
  submitting?: boolean;
}

// Room codes are generated as 4 letters + 2 digits, e.g. "WARP-72" (see
// lib/roomService.generateRoomCode). Strip anything the user types that
// isn't alphanumeric, uppercase it, and insert the "-" for them once
// they're past the 4-letter block, so they never have to type it.
function formatRoomCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export default function JoinScreen({ onJoin, error, submitting = false }: JoinScreenProps) {
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");

  const canJoin = roomCode.trim().length > 0 && name.trim().length > 0 && !submitting;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canJoin) return;
    onJoin(name.trim(), roomCode.trim().toUpperCase());
  }

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div className={styles.brand}>
        <span className={styles.eyebrow}>TimeWarp Trivia</span>
        <h1 className={styles.title}>Join the Game</h1>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="room-code">
            Room Code
          </label>
          <input
            id="room-code"
            className={styles.input}
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="WARP-72"
            maxLength={7}
            value={roomCode}
            onChange={(e) => setRoomCode(formatRoomCode(e.target.value))}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="display-name">
            Display Name
          </label>
          <input
            id="display-name"
            className={`${styles.input} ${styles.nameInput}`}
            type="text"
            autoComplete="off"
            placeholder="What should we call you?"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.spacer} />

        <button type="submit" className={styles.joinButton} disabled={!canJoin}>
          {submitting ? "Joining…" : "Join Game"}
        </button>
      </form>
    </div>
  );
}
