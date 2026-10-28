"use client";

import { useEffect, useState } from "react";
import { isMusicEnabled, setMusicEnabled } from "@/lib/music";
import { MusicOffIcon, MusicOnIcon } from "./AudioIcons";
import styles from "./MusicToggle.module.scss";

// Persistent mute control for the low-volume background music track —
// separate from SoundToggle's SFX mute, so a player can turn one off
// without the other. Same fixed-position/known-focus-trap-gap pattern
// as SoundToggle (see that component's own comment) — mounted right
// next to it at the same call sites.
export default function MusicToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isMusicEnabled());
  }, []);

  function handleClick() {
    const next = !enabled;
    setEnabled(next);
    setMusicEnabled(next);
  }

  return (
    <button
      type="button"
      data-dpad-focusable
      className={styles.button}
      onClick={handleClick}
      aria-pressed={!enabled}
      aria-label={enabled ? "Mute background music" : "Unmute background music"}
    >
      {enabled ? <MusicOnIcon /> : <MusicOffIcon />}
    </button>
  );
}
