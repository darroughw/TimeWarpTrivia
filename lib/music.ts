// Low-volume looping background music, played only while a round is
// actually in progress — see each *TvFlow.tsx's room.status effect.
// Separate module from lib/sounds.ts (one-shot SFX, a cached <audio> per
// sound) since this is a single continuously-looping track with its own
// mute toggle (MusicToggle) distinct from SoundToggle's SFX mute — a
// player can have one on and the other off.
//
// background-loop.m4a is an original composition generated for this
// app, not a recording or transcription of any existing copyrighted
// work — see apple-tv/TimeWarpTrivia/Sound/MusicPlayer.swift's identical
// note for the native build's copy of the same track. AAC-in-M4A rather
// than MP3 (unlike the other sounds in lib/sounds.ts) — no local MP3
// encoder was available to produce one, and every target here (modern
// desktop/mobile browsers, plus the Chromium-based WebViews the
// Android TV and Fire TV apps load this site in) plays AAC natively.
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
  if (!enabled) stopBackgroundMusic();
  // Turning it back on doesn't resume playback here — whether music
  // should be playing right now is still governed by game state (each
  // flow's room.status effect), not just this flag.
}

let audio: HTMLAudioElement | null = null;

function getOrCreateAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(MUSIC_FILE);
    audio.loop = true;
    audio.volume = VOLUME;
  }
  return audio;
}

export function playBackgroundMusic(): void {
  if (typeof window === "undefined" || !isMusicEnabled()) return;
  const el = getOrCreateAudio();
  if (!el.paused) return;
  // Same "browser can reject play() without a prior user gesture"
  // swallow as lib/sounds.ts's playSound.
  void el.play().catch(() => {});
}

export function stopBackgroundMusic(): void {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
