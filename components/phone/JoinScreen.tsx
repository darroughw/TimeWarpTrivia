"use client";

import { useState } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import styles from "./JoinScreen.module.scss";

interface JoinScreenProps {
  onJoin: (name: string, roomCode: string) => void;
}

export default function JoinScreen({ onJoin }: JoinScreenProps) {
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");

  const canJoin = roomCode.trim().length > 0 && name.trim().length > 0;

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
            maxLength={12}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
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

        <div className={styles.spacer} />

        <button type="submit" className={styles.joinButton} disabled={!canJoin}>
          Join Game
        </button>
      </form>
    </div>
  );
}
