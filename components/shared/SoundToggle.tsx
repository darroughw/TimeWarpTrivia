"use client";

import { useEffect, useState } from "react";
import { isSoundEnabled, preloadAllSounds, setSoundEnabled } from "@/lib/sounds";
import styles from "./SoundToggle.module.scss";

// Persistent mute control for the game's sound effects (correct/wrong,
// countdown urgency tick, everyone-wrong trombone). Fixed-position so one
// instance per flow covers every screen without each screen wiring it in
// individually — see call sites in the *TvFlow/*PlayFlow files.
//
// Also doubles as the sound system's warm-up point: every one of those
// call sites mounts this early (lobby/join screen), so preloading here
// means the actual sound files are already fetched by the time anything
// tries to play one — see preloadAllSounds's own comment.
//
// Known gap: LobbyScreen/DeepCutsLobbyScreen/EndGameScreen/TvIntroScreen
// each run their own useDpadNavigation focus trap (arrow keys + Tab don't
// leave that screen's own container — see that hook's own comment). This
// button lives outside those containers, so on a real D-pad-only remote
// it's only reachable while a different (untrapped) screen is active —
// QuestionScreen, RoundTransitionScreen, ScoreboardScreen, BlockScreen —
// not those four. Still reachable there by mouse/touch. Same category of
// known limitation as DecadeFilter's D-pad quirk (see README).
export default function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
    preloadAllSounds();
  }, []);

  function handleClick() {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
  }

  return (
    <button
      type="button"
      data-dpad-focusable
      className={styles.button}
      onClick={handleClick}
      aria-pressed={!enabled}
      aria-label={enabled ? "Mute sound effects" : "Unmute sound effects"}
    >
      <span aria-hidden="true">{enabled ? "🔊" : "🔇"}</span>
    </button>
  );
}
