"use client";

import { useEffect, useState } from "react";
import HelpButton from "@/components/shared/HelpButton";
import SoundToggle from "@/components/shared/SoundToggle";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { getAvatarForName } from "@/lib/avatar";
import { randomCharacter } from "@/lib/characters";
import { isNicknameAllowed } from "@/lib/nicknameFilter";
import CharacterPicker from "./CharacterPicker";
import LogoFooter from "./LogoFooter";
import styles from "./JoinScreen.module.scss";

interface JoinScreenProps {
  // avatar: the chosen character's emoji, stored as players.avatar.
  onJoin: (name: string, roomCode: string, avatar: string) => void;
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
  const [nameError, setNameError] = useState<string>();
  const [avatar, setAvatar] = useState<string | null>(null);

  // Preselect a random character, after mount rather than as initial
  // state: this page is prerendered, and a server-picked random value
  // wouldn't match the browser's (hydration mismatch).
  useEffect(() => {
    setAvatar((current) => current ?? randomCharacter().emoji);
  }, []);

  const canJoin = roomCode.trim().length > 0 && name.trim().length > 0 && avatar !== null && !submitting;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canJoin) return;
    const trimmedName = name.trim();
    if (!isNicknameAllowed(trimmedName)) {
      setNameError("Pick a different display name — that one's not allowed.");
      return;
    }
    setNameError(undefined);
    onJoin(trimmedName, roomCode.trim().toUpperCase(), avatar ?? randomCharacter().emoji);
  }

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <SoundToggle />
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
            onChange={(e) => {
              setName(e.target.value);
              setNameError(undefined);
            }}
          />
          <p className={styles.hint}>Keep it friendly — hosts can remove any player.</p>
        </div>

        <CharacterPicker value={avatar} onChange={setAvatar} color={getAvatarForName(name || "player").color} />

        {nameError && <p className={styles.error}>{nameError}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.spacer} />

        <button type="submit" className={styles.joinButton} disabled={!canJoin}>
          {submitting ? "Joining…" : "Join Game"}
        </button>
      </form>

      <div className={styles.helpRow}>
        <HelpButton />
      </div>

      <LogoFooter />
    </div>
  );
}
