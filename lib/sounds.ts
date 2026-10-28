import type { DecadeId } from "@/lib/types";

// Sound effects — all original, synthesized by scripts/compose-audio.mjs
// in the same 80s synth palette as the background music. No samples or
// third-party audio.
export type SoundName =
  | "correct"
  | "wrong"
  | "tick"
  | "trombone"
  | "join"
  | "whoosh"
  | "block"
  | "fanfare"
  | "decadeSting";

// Game sounds: rendered as AAC (.m4a) because no MP3 encoder is
// available on the machine that renders them; every target browser and
// WebView plays AAC natively. Re-render with `node scripts/compose-audio.mjs`.

const SOUND_FILES: Record<SoundName, string> = {
  correct: "/sounds/correct.m4a",
  wrong: "/sounds/wrong.m4a",
  tick: "/sounds/tick.m4a",
  trombone: "/sounds/trombone.m4a",
  join: "/sounds/join.m4a",
  whoosh: "/sounds/whoosh.m4a",
  block: "/sounds/block.m4a",
  fanfare: "/sounds/fanfare.m4a",
  decadeSting: "/sounds/decade-sting.m4a",
};

const STORAGE_KEY = "twt-sound-enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    // Private-browsing/storage-blocked contexts — default to on rather
    // than silently muting the whole game over a storage read failure.
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Nothing to fall back to — the toggle just won't persist this session.
  }
}

// One <audio> element per sound, reused across plays (`currentTime = 0`
// restarts it) instead of a fresh Audio() per call — avoids piling up
// unreleased elements when a sound fires repeatedly (the urgency tick,
// once a second for 5 seconds straight).
const audioCache = new Map<SoundName, HTMLAudioElement>();

function getOrCreateAudio(name: SoundName): HTMLAudioElement {
  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(SOUND_FILES[name]);
    audioCache.set(name, audio);
  }
  return audio;
}

export function playSound(name: SoundName): void {
  if (typeof window === "undefined" || !isSoundEnabled()) return;

  const audio = getOrCreateAudio(name);
  audio.currentTime = 0;
  // Browsers can reject play() without a preceding user gesture in this
  // tick (e.g. the very first sound of a session) — that's expected and
  // fine to swallow, not a real error.
  void audio.play().catch(() => {});
}

// Warms audioCache ahead of time so playSound's first real call doesn't
// pay for the network fetch — without this, every sound's *first* play
// had a fetch-then-decode delay before anything was audible, which read
// as "the sound starts late" (worst on the decade stings: clicking a
// pill is a tight, direct cause-and-effect interaction, so any lag there
// is far more noticeable than the same delay on a full-screen transition
// like the trombone or fanfare). Call once, early — see SoundToggle.
export function preloadAllSounds(): void {
  if (typeof window === "undefined") return;
  for (const name of Object.keys(SOUND_FILES) as SoundName[]) {
    const audio = getOrCreateAudio(name);
    audio.preload = "auto";
    audio.load();
  }
}

// One shared sting for picking any decade. None for "all" — All Decades
// stays on the neutral/default theme (TIM-14), so it gets no sting either.
export function playDecadeSting(decade: DecadeId): void {
  if (decade !== "all") playSound("decadeSting");
}
