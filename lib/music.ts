// Low-volume looping background music for the TV screens. Separate module
// from lib/sounds.ts (one-shot SFX, a cached <audio> per sound) since this
// is a single continuously-looping track with its own mute toggle
// (MusicToggle) distinct from SoundToggle's SFX mute — a player can have
// one on and the other off.
//
// Two inputs decide whether it plays:
//   - "wanted": set by each *TvFlow from game state — every screen from
//     the lobby through the last question, not the end screen (matching
//     the Apple TV app).
//   - "enabled": the persisted Music toggle.
// It plays only when both are true. The lobby is usually the page's very
// first screen, before anyone has clicked, and browsers block audio until
// then — so a blocked start retries on the first click or key press.
//
// background-loop.m4a is an original composition rendered by
// scripts/compose-audio.mjs — not a recording or transcription of any
// existing copyrighted work. AAC-in-M4A: every target here (modern
// desktop/mobile browsers, plus the Chromium-based WebViews the Android
// TV and Fire TV apps load this site in) plays AAC natively.
const MUSIC_FILE = "/sounds/background-loop.m4a";
const VOLUME = 0.11;

const STORAGE_KEY = "twt-music-enabled";

export function isMusicEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function setMusicEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Nothing to fall back to — the toggle just won't persist this session.
  }
  // Called from the toggle's click handler — a user gesture, so turning
  // music back on can start it right away.
  sync();
}

let audio: HTMLAudioElement | null = null;
let wanted = false;
let retryArmed = false;

function getOrCreateAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(MUSIC_FILE);
    audio.loop = true;
    audio.volume = VOLUME;
  }
  return audio;
}

// Browsers reject play() until the page has had a click or key press. Try
// again on the first one, once.
function retryOnFirstGesture(): void {
  if (retryArmed || typeof window === "undefined") return;
  retryArmed = true;
  const retry = () => {
    window.removeEventListener("pointerdown", retry, true);
    window.removeEventListener("keydown", retry, true);
    retryArmed = false;
    sync();
  };
  window.addEventListener("pointerdown", retry, true);
  window.addEventListener("keydown", retry, true);
}

function sync(): void {
  if (typeof window === "undefined") return;
  if (!wanted || !isMusicEnabled()) {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    return;
  }
  const el = getOrCreateAudio();
  if (!el.paused) return;
  void el.play().catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "NotAllowedError") retryOnFirstGesture();
  });
}

// Each TV flow calls this whenever its game state changes (and with false
// on unmount, so music can't keep looping after the TV screen is gone).
export function setBackgroundMusicWanted(value: boolean): void {
  wanted = value;
  sync();
}
