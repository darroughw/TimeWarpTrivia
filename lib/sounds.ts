import type { DecadeId } from "@/lib/types";

// Sound effects — all sourced from Mixkit's free SFX library (commercial
// use OK, no attribution required; see each file's source below), never
// embedded third-party video/audio, per CLAUDE.md's licensing note under
// TIM-13. The decade* entries are the exception — see the CC0/opengameart
// note further down for why those come from a different source.
export type SoundName =
  | "correct"
  | "wrong"
  | "tick"
  | "trombone"
  | "join"
  | "whoosh"
  | "block"
  | "fanfare"
  | "decade60s"
  | "decade70s"
  | "decade80s"
  | "decade90s"
  | "decade2000s"
  | "decade2010s";

// Source: https://mixkit.co/free-sound-effects/ (Mixkit Free License)
// - correct  -> "Correct answer tone"              (mixkit.co/free-sound-effects/correct/)
// - wrong    -> "Game show wrong answer buzz"       (mixkit.co/free-sound-effects/wrong/)
// - tick     -> "Clock ticker single"               (mixkit.co/free-sound-effects/clock/)
// - trombone -> "Slow sad trombone fail"            (mixkit.co/free-sound-effects/wrong/)
// - join     -> "Positive notification"             (mixkit.co/free-sound-effects/notification/)
// - whoosh   -> "Cinematic whoosh fast transition"  (mixkit.co/free-sound-effects/whoosh/)
// - block    -> "Cartoon string suspense"           (mixkit.co/free-sound-effects/suspense/)
// - fanfare  -> "Grand brass fanfare"               (mixkit.co/free-sound-effects/fanfare/)
//
// Decade stings are trimmed (~2.5s, faded in/out) from full CC0 tracks on
// opengameart.org, NOT Mixkit — Mixkit's *music* license (distinct from
// its SFX license, which does allow games) explicitly excludes video
// games, and this app ships as a packaged game on the Fire TV Appstore.
// CC0 needs no attribution either way.
// - decade60s   -> "Espionage" by brandon75689 (opengameart.org/content/espionage)
// - decade70s   -> "Funked Up" by Joth (opengameart.org/content/funked-up)
// - decade80s   -> "Synth Wave" by Pro Sensory (opengameart.org/content/synth-wave)
// - decade90s   -> "lofi hip hop" by omfgdude (opengameart.org/content/lofi-hip-hop)
// - decade2000s -> "1-UP Nightclub" by neonarkade (opengameart.org/content/1-up-nightclub)
// - decade2010s -> "Vengeance Electro" by Of Far Different Nature (opengameart.org/content/vengeance-electro)
const SOUND_FILES: Record<SoundName, string> = {
  correct: "/sounds/correct.mp3",
  wrong: "/sounds/wrong.mp3",
  tick: "/sounds/tick.mp3",
  trombone: "/sounds/trombone.mp3",
  join: "/sounds/join.mp3",
  whoosh: "/sounds/whoosh.mp3",
  block: "/sounds/block.mp3",
  fanfare: "/sounds/fanfare.mp3",
  decade60s: "/sounds/decade-60s.mp3",
  decade70s: "/sounds/decade-70s.mp3",
  decade80s: "/sounds/decade-80s.mp3",
  decade90s: "/sounds/decade-90s.mp3",
  decade2000s: "/sounds/decade-2000s.mp3",
  decade2010s: "/sounds/decade-2010s.mp3",
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

export function playSound(name: SoundName): void {
  if (typeof window === "undefined" || !isSoundEnabled()) return;

  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(SOUND_FILES[name]);
    audioCache.set(name, audio);
  }
  audio.currentTime = 0;
  // Browsers can reject play() without a preceding user gesture in this
  // tick (e.g. the very first sound of a session) — that's expected and
  // fine to swallow, not a real error.
  void audio.play().catch(() => {});
}

const DECADE_STING_SOUND: Partial<Record<DecadeId, SoundName>> = {
  "60s": "decade60s",
  "70s": "decade70s",
  "80s": "decade80s",
  "90s": "decade90s",
  "2000s": "decade2000s",
  "2010s": "decade2010s",
};

// No entry for "all" — All Decades stays on the neutral/default theme
// (TIM-14), so it gets no themed sting either.
export function playDecadeSting(decade: DecadeId): void {
  const sound = DECADE_STING_SOUND[decade];
  if (sound) playSound(sound);
}
