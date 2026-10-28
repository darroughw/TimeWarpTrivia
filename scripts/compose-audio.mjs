#!/usr/bin/env node
// Renders TimeWarp Trivia's background music and game sound effects from
// scratch — an original mid-80s synth-pop score (staccato octave bass,
// brassy sync-style lead, drum machine, synth-brass stabs) written and
// synthesized entirely in this file. No samples, no recordings, and no
// melody borrowed from any existing song: the hook below is original.
//
// Usage: node scripts/compose-audio.mjs
// Writes AAC .m4a files into public/sounds/ (web) and
// apple-tv/TimeWarpTrivia/Resources/Sounds/ (Apple TV) via macOS's
// afconvert. Deterministic: the same code always renders the same audio.

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIRS = [join(ROOT, "public/sounds"), join(ROOT, "apple-tv/TimeWarpTrivia/Resources/Sounds")];
const SR = 44100;

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Seeded PRNG so noise (drums) renders identically every run.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const noise = rng(1985);
const white = () => noise() * 2 - 1;

// Band-limited oscillators (polyBLEP) — keeps the bright synths from
// sounding fizzy/aliased.
function blep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}
const saw = (ph, dt) => 2 * ph - 1 - blep(ph, dt);
const pulse = (ph, dt, pw) => (ph < pw ? 1 : -1) + blep(ph, dt) - blep((ph + 1 - pw) % 1, dt);

// Zero-delay-feedback state-variable filter (lowpass/highpass/bandpass).
class SVF {
  constructor() {
    this.ic1 = 0;
    this.ic2 = 0;
  }
  run(x, cutoff, q) {
    const g = Math.tan((Math.PI * Math.min(Math.max(cutoff, 20), SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - this.ic2;
    const v1 = a1 * this.ic1 + a2 * v3;
    const v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    return { lp: v2, bp: v1, hp: x - k * v1 - v2 };
  }
}

// A stereo buffer ("bus") that voices write into, with equal-power pan.
class Bus {
  constructor(length) {
    this.L = new Float32Array(length);
    this.R = new Float32Array(length);
  }
  add(i, v, pan = 0) {
    if (i < 0 || i >= this.L.length) return;
    const p = (pan + 1) * 0.25 * Math.PI;
    this.L[i] += v * Math.cos(p);
    this.R[i] += v * Math.sin(p);
  }
}

// Freeverb-style reverb: parallel damped combs into series allpasses.
function reverb(bus, { room = 0.84, damp = 0.25, wet = 1 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allpasses = [556, 441, 341, 225];
  const out = new Bus(bus.L.length);
  for (const [channel, spread] of [["L", 0], ["R", 23]]) {
    const input = bus[channel];
    const acc = new Float32Array(input.length);
    for (const len of combs) {
      const buf = new Float32Array(len + spread);
      let idx = 0;
      let store = 0;
      for (let i = 0; i < input.length; i++) {
        const y = buf[idx];
        store = y * (1 - damp) + store * damp;
        buf[idx] = input[i] * 0.015 + store * room;
        acc[i] += y;
        idx = (idx + 1) % buf.length;
      }
    }
    for (const len of allpasses) {
      const buf = new Float32Array(len + spread);
      let idx = 0;
      for (let i = 0; i < acc.length; i++) {
        const b = buf[idx];
        buf[idx] = acc[i] + b * 0.5;
        acc[i] = b - acc[i];
        idx = (idx + 1) % buf.length;
      }
    }
    for (let i = 0; i < acc.length; i++) out[channel][i] = acc[i] * wet;
  }
  return out;
}

// Ping-pong delay with a darkening filter in the feedback loop.
function delay(bus, { time, feedback = 0.35, wet = 0.4 }) {
  const n = Math.round(time * SR);
  const out = new Bus(bus.L.length);
  const fl = new SVF();
  const fr = new SVF();
  for (let i = 0; i < bus.L.length; i++) {
    const dl = i >= n ? out.R[i - n] * feedback + bus.L[i - n] : 0;
    const dr = i >= n ? out.L[i - n] * feedback : 0;
    out.L[i] = fl.run(dl, 3500, 0.7).lp;
    out.R[i] = fr.run(dr, 3500, 0.7).lp;
  }
  for (let i = 0; i < bus.L.length; i++) {
    out.L[i] *= wet;
    out.R[i] *= wet;
  }
  return out;
}

function mixInto(target, source, gain = 1) {
  for (let i = 0; i < target.L.length; i++) {
    target.L[i] += source.L[i] * gain;
    target.R[i] += source.R[i] * gain;
  }
}

// ---------------------------------------------------------------------------
// Instruments
// ---------------------------------------------------------------------------

// One synth note. `wave(ph, dt, voiceIndex)` returns a sample; several
// detuned voices are stacked and run through an enveloped lowpass.
function synth(bus, { start, dur, midi, glideFrom, glideTime = 0.04, voices = [0], wave, amp = 0.3,
  attack = 0.004, decay = 0.15, sustain = 0.6, release = 0.06,
  cutoff = 2000, cutoffPeak = 6000, cutoffDecay = 0.12, q = 1.2, pan = 0, spread = 0 }) {
  const startI = Math.round(start * SR);
  const total = dur + release;
  const n = Math.round(total * SR);
  const filters = [new SVF(), new SVF()];
  const phases = voices.map((_, v) => (v * 0.37) % 1);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // Amp envelope (ADSR, release from the note-off level).
    let env;
    if (t < attack) env = t / attack;
    else if (t < attack + decay) env = 1 - (1 - sustain) * ((t - attack) / decay);
    else env = sustain;
    if (t > dur) env *= Math.max(0, 1 - (t - dur) / release);
    const fc = cutoff + (cutoffPeak - cutoff) * Math.exp(-t / cutoffDecay);
    const m = glideFrom !== undefined && t < glideTime ? glideFrom + (midi - glideFrom) * (t / glideTime) : midi;
    let l = 0;
    let r = 0;
    voices.forEach((cents, v) => {
      const hz = midiToHz(m) * Math.pow(2, cents / 1200);
      const dt = hz / SR;
      phases[v] = (phases[v] + dt) % 1;
      const s = wave(phases[v], dt, v);
      const p = voices.length > 1 ? (v / (voices.length - 1)) * 2 - 1 : 0;
      l += s * (1 - p * spread);
      r += s * (1 + p * spread);
    });
    const yl = filters[0].run(l / voices.length, fc, q).lp;
    const yr = filters[1].run(r / voices.length, fc, q).lp;
    const idx = startI + i;
    if (idx >= bus.L.length) break;
    const pp = (pan + 1) * 0.25 * Math.PI;
    bus.L[idx] += yl * env * amp * Math.cos(pp) * Math.SQRT2;
    bus.R[idx] += yr * env * amp * Math.sin(pp) * Math.SQRT2;
  }
}

// Drum machine voices.
function kick(bus, start, amp = 0.9) {
  const s = Math.round(start * SR);
  let ph = 0;
  for (let i = 0; i < 0.4 * SR; i++) {
    const t = i / SR;
    const hz = 48 + 110 * Math.exp(-t / 0.035);
    ph += hz / SR;
    const body = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.22);
    const click = t < 0.004 ? white() * (1 - t / 0.004) * 0.5 : 0;
    bus.add(s + i, (body + click) * amp);
  }
}

function snare(bus, start, amp = 0.55) {
  const s = Math.round(start * SR);
  const f = new SVF();
  let ph = 0;
  for (let i = 0; i < 0.3 * SR; i++) {
    const t = i / SR;
    ph += 185 / SR;
    const tone = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.06) * 0.6;
    const hiss = f.run(white(), 1800, 0.7).hp * Math.exp(-t / 0.11);
    bus.add(s + i, (tone + hiss) * amp);
  }
}

function clap(bus, start, amp = 0.35) {
  const s = Math.round(start * SR);
  const f = new SVF();
  for (let i = 0; i < 0.25 * SR; i++) {
    const t = i / SR;
    // Three fast flams then a short tail — the 808/Linn handclap shape.
    const burst = [0, 0.011, 0.022].reduce((e, o) => e + (t >= o ? Math.exp(-(t - o) / 0.006) : 0), 0);
    const env = burst * 0.6 + (t > 0.022 ? Math.exp(-(t - 0.022) / 0.07) : 0);
    bus.add(s + i, f.run(white(), 1300, 2).bp * env * amp, 0.1);
  }
}

function hat(bus, start, { open = false, amp = 0.12, pan = 0.25 } = {}) {
  const s = Math.round(start * SR);
  const f = new SVF();
  const len = open ? 0.28 : 0.045;
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR;
    bus.add(s + i, f.run(white(), 8000, 0.8).hp * Math.exp(-t / (len / 3)) * amp, pan);
  }
}

function tom(bus, start, midi, amp = 0.5) {
  const s = Math.round(start * SR);
  let ph = 0;
  const base = midiToHz(midi);
  for (let i = 0; i < 0.35 * SR; i++) {
    const t = i / SR;
    ph += (base * (1 + 0.6 * Math.exp(-t / 0.05))) / SR;
    bus.add(s + i, Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.15) * amp, -0.2);
  }
}

function sweep(bus, start, dur, { from = 300, to = 9000, amp = 0.25, rising = true } = {}) {
  const s = Math.round(start * SR);
  const f = new SVF();
  const n = Math.round(dur * SR);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const fc = rising ? from * Math.pow(to / from, t) : to * Math.pow(from / to, t);
    const env = Math.sin(Math.PI * t);
    bus.add(s + i, f.run(white(), fc, 3).bp * env * amp, (t - 0.5) * 0.8);
  }
}

// The signature sounds.
const BASS = { voices: [-6, 6], wave: (ph, dt, v) => (v ? pulse(ph, dt, 0.5) : saw(ph, dt)),
  amp: 0.42, attack: 0.002, decay: 0.09, sustain: 0.45, release: 0.03,
  cutoff: 260, cutoffPeak: 2600, cutoffDecay: 0.07, q: 2.2 };
// Brassy "sync"-style lead: bright pulse+saw, punchy filter blip, quick glide.
const LEAD = { voices: [-7, 0, 7], wave: (ph, dt, v) => (v === 1 ? pulse(ph, dt, 0.32) : saw(ph, dt)),
  amp: 0.24, attack: 0.003, decay: 0.12, sustain: 0.55, release: 0.07,
  cutoff: 2400, cutoffPeak: 7500, cutoffDecay: 0.09, q: 1.6, spread: 0.6 };
// Synth-brass chord stab.
const STAB = { voices: [-11, -4, 4, 11], wave: (ph, dt) => saw(ph, dt),
  amp: 0.11, attack: 0.008, decay: 0.16, sustain: 0.3, release: 0.12,
  cutoff: 900, cutoffPeak: 5200, cutoffDecay: 0.1, q: 1.1, spread: 0.9 };
const PAD = { voices: [-9, 0, 9], wave: (ph, dt) => saw(ph, dt),
  amp: 0.05, attack: 0.5, decay: 0.5, sustain: 0.9, release: 0.8,
  cutoff: 1100, cutoffPeak: 1500, cutoffDecay: 1, q: 0.8, spread: 1 };

// ---------------------------------------------------------------------------
// Background music: 24 bars at 118 BPM in D minor (~49s), looping.
// ---------------------------------------------------------------------------

function renderMusic() {
  const BPM = 118;
  const STEP = 60 / BPM / 4; // a 16th note
  const BAR = STEP * 16;
  const BARS = 24;
  const LEN = Math.round(BARS * BAR * SR);
  const TAIL = Math.round(3 * SR);
  const N = LEN + TAIL;
  const at = (bar, step) => bar * BAR + step * STEP;

  const drums = new Bus(N);
  const snareBus = new Bus(N);
  const bass = new Bus(N);
  const stabs = new Bus(N);
  const lead = new Bus(N);
  const pad = new Bus(N);

  // 8-bar progression: i i VI VII i i iv V  (Dm Dm Bb C Dm Dm Gm A)
  const roots = [38, 38, 46, 48, 38, 38, 43, 45];
  const chords = [
    [62, 65, 69], [62, 65, 69], [62, 65, 70], [60, 64, 67],
    [62, 65, 69], [62, 65, 69], [62, 67, 70], [61, 64, 69],
  ];

  // Staccato octave-bouncing bass: [step, semitones above root].
  const bassLine = [[0, 0], [2, 0], [3, 12], [5, 0], [6, 12], [8, 0], [10, 0], [11, 12], [12, 7], [14, 12], [15, 7]];
  const stabSteps = [2, 7, 10];

  // Original hook, [step, midi, lengthInSteps] per bar of the progression.
  const hook = [
    [[0, 69, 2], [3, 74, 1], [4, 74, 1], [6, 77, 2], [8, 76, 1], [10, 74, 2], [12, 72, 1], [13, 74, 3]],
    [[2, 74, 1], [3, 76, 1], [4, 77, 2], [6, 79, 2], [8, 81, 4]],
    [[0, 82, 2], [2, 81, 1], [3, 79, 1], [4, 77, 2], [7, 74, 1], [8, 77, 3], [12, 79, 2]],
    [[0, 76, 3], [4, 72, 2], [6, 74, 1], [7, 76, 1], [8, 72, 4]],
    [[0, 69, 2], [3, 74, 1], [4, 74, 1], [6, 77, 2], [8, 76, 1], [10, 74, 2], [12, 72, 1], [13, 74, 3]],
    [[2, 74, 1], [3, 76, 1], [4, 77, 2], [6, 81, 2], [8, 86, 4]],
    [[0, 82, 2], [2, 81, 1], [3, 79, 1], [4, 74, 2], [6, 79, 2], [8, 82, 2], [10, 81, 2], [12, 79, 2]],
    [[0, 81, 2], [2, 79, 1], [3, 77, 1], [4, 76, 4], [8, 73, 2], [10, 76, 2], [12, 69, 4]],
  ];
  // A short answering riff for the groove section, so it isn't hookless.
  const answer = [[8, 81, 1], [9, 79, 1], [10, 77, 1], [11, 76, 1], [12, 74, 3]];

  const kickTimes = [];
  for (let bar = 0; bar < BARS; bar++) {
    const p = bar % 8;
    const section = Math.floor(bar / 8); // 0 groove, 1 hook, 2 hook + pad
    const root = roots[p];
    const lastBarOfPhrase = p === 7;

    // Drums
    for (const step of [0, 7, 8, ...(bar % 2 ? [14] : [])]) {
      if (lastBarOfPhrase && step >= 12) continue;
      kick(drums, at(bar, step));
      kickTimes.push(at(bar, step));
    }
    for (const step of [4, 12]) {
      if (lastBarOfPhrase && step === 12) continue;
      snare(snareBus, at(bar, step));
      clap(drums, at(bar, step));
    }
    for (let step = 0; step < 16; step++) {
      if (lastBarOfPhrase && step >= 12) continue;
      hat(drums, at(bar, step), { amp: step % 4 === 2 ? 0.14 : 0.07, open: step === 14 });
    }
    if (lastBarOfPhrase) {
      // Tom fill into the next phrase.
      [[12, 50], [13, 47], [14, 43], [15, 40]].forEach(([s, m]) => tom(drums, at(bar, s), m));
    }

    // Bass
    for (const [step, interval] of bassLine) {
      synth(bass, { ...BASS, start: at(bar, step), dur: STEP * 0.7, midi: root + interval });
    }

    // Stabs (lighter while the lead plays)
    for (const step of stabSteps) {
      for (const m of chords[p]) {
        synth(stabs, { ...STAB, amp: section === 0 ? STAB.amp : STAB.amp * 0.7, start: at(bar, step), dur: STEP * 1.2, midi: m });
      }
    }

    // Pad in the last section for lift
    if (section === 2) {
      for (const m of chords[p]) synth(pad, { ...PAD, start: at(bar, 0), dur: BAR * 0.95, midi: m - 12 });
    }

    // Lead
    const phrase = section === 0 ? (p === 3 || p === 7 ? answer : []) : hook[p];
    let previous;
    for (const [step, midi, len] of phrase) {
      // Section 3 drops the first half of the hook an octave for contrast.
      const m = section === 2 && p < 4 ? midi - 12 : midi;
      synth(lead, { ...LEAD, start: at(bar, step), dur: STEP * len * 0.82, midi: m, glideFrom: previous });
      previous = m;
    }
  }

  // Sidechain-style pump: bass, stabs, and pad duck under each kick.
  const duck = new Float32Array(N).fill(1);
  for (const t of kickTimes) {
    const s = Math.round(t * SR);
    for (let i = 0; i < 0.25 * SR && s + i < N; i++) duck[s + i] = Math.min(duck[s + i], 1 - 0.55 * Math.exp(-i / SR / 0.09));
  }
  for (const b of [bass, stabs, pad]) for (let i = 0; i < N; i++) { b.L[i] *= duck[i]; b.R[i] *= duck[i]; }

  const master = new Bus(N);
  mixInto(master, drums, 1);
  mixInto(master, snareBus, 1);
  mixInto(master, reverb(snareBus, { room: 0.8, damp: 0.3 }), 0.5);
  mixInto(master, bass, 1);
  mixInto(master, stabs, 1);
  mixInto(master, reverb(stabs, { room: 0.82 }), 0.35);
  mixInto(master, pad, 1);
  mixInto(master, lead, 1);
  mixInto(master, delay(lead, { time: STEP * 3, feedback: 0.32, wet: 0.35 }), 1);
  mixInto(master, reverb(lead, { room: 0.84 }), 0.3);

  // Wrap the effect tails past the loop point back onto the start, so the
  // loop is seamless.
  for (let i = 0; i < TAIL; i++) {
    master.L[i] += master.L[LEN + i];
    master.R[i] += master.R[LEN + i];
  }
  return finalize(master, LEN, LEVELS["background-loop"]);
}

// ---------------------------------------------------------------------------
// Sound effects — the same synths, as one-shots.
// ---------------------------------------------------------------------------

function renderSfx(name, seconds, compose, { reverbMix = 0.25, room = 0.84, echo, fadeOut = 0 } = {}) {
  const N = Math.round(seconds * SR);
  const dry = new Bus(N);
  compose(dry);
  const master = new Bus(N);
  mixInto(master, dry, 1);
  if (echo) mixInto(master, delay(dry, echo), 1);
  mixInto(master, reverb(dry, { room }), reverbMix);
  // Optional fade so a trimmed effect tail ends smoothly, not abruptly.
  const fadeStart = N - Math.round(fadeOut * SR);
  for (let i = Math.max(0, fadeStart); i < N; i++) {
    const g = (N - i) / (N - fadeStart);
    master.L[i] *= g;
    master.R[i] *= g;
  }
  return finalize(master, N, LEVELS[name]);
}

const step = 60 / 118 / 4;
const leadNote = (bus, start, midi, len, extra = {}) =>
  synth(bus, { ...LEAD, amp: 0.4, start, dur: len, midi, ...extra });
const stabChord = (bus, start, notes, len, extra = {}) =>
  notes.forEach((m) => synth(bus, { ...STAB, amp: 0.2, start, dur: len, midi: m, ...extra }));

const SFX = {
  // Bright rising arpeggio + stab: you got it.
  correct: () => renderSfx("correct", 1.4, (b) => {
    [74, 78, 81, 86].forEach((m, i) => leadNote(b, i * step, m, step * 0.85));
    stabChord(b, step * 4, [74, 78, 81, 86], step * 3);
    kick(b, step * 4, 0.5);
  }),
  // Two falling, detuned buzzes.
  wrong: () => renderSfx("wrong", 1.0, (b) => {
    synth(b, { ...BASS, amp: 0.6, start: 0, dur: step * 1.6, midi: 46, cutoffPeak: 1800, voices: [-25, 25] });
    synth(b, { ...BASS, amp: 0.6, start: step * 2, dur: step * 3, midi: 40, glideFrom: 46, glideTime: 0.12, cutoffPeak: 1500, voices: [-25, 25] });
  }, { reverbMix: 0.15 }),
  // Last-five-seconds tick: a short, dry high blip.
  tick: () => renderSfx("tick", 0.25, (b) => {
    synth(b, { ...LEAD, amp: 0.45, start: 0, dur: 0.03, midi: 96, decay: 0.03, sustain: 0, release: 0.02, cutoffPeak: 9000 });
    hat(b, 0, { amp: 0.15, pan: 0 });
  }, { reverbMix: 0.05 }),
  // Everyone missed: a slumping "wah-wah-wah-waaah" on the lead synth.
  trombone: () => renderSfx("trombone", 2.6, (b) => {
    const notes = [[0, 67], [0.38, 66], [0.76, 65], [1.14, 64]];
    notes.forEach(([t, m], i) =>
      synth(b, { ...LEAD, amp: 0.4, start: t, dur: i === 3 ? 0.9 : 0.3, midi: m, glideFrom: i === 3 ? m : undefined,
        cutoff: 700, cutoffPeak: 2600, cutoffDecay: 0.18, voices: [-12, 0, 12] }));
    // The last note sags a whole tone.
    synth(b, { ...LEAD, amp: 0.25, start: 1.6, dur: 0.5, midi: 62, glideFrom: 64, glideTime: 0.5, cutoff: 500, cutoffPeak: 900 });
  }),
  // A player joined: two quick rising blips.
  join: () => renderSfx("join", 0.7, (b) => {
    leadNote(b, 0, 81, step * 0.7);
    leadNote(b, step, 88, step * 1.2);
  }),
  // Screen/round transition: filtered noise rush up and away.
  whoosh: () => renderSfx("whoosh", 0.9, (b) => sweep(b, 0, 0.8, { from: 400, to: 9000, amp: 0.5 }), { reverbMix: 0.3 }),
  // The block round: low ominous stab hits.
  block: () => renderSfx("block", 1.8, (b) => {
    kick(b, 0, 0.8);
    stabChord(b, 0, [50, 53, 57], step * 2, { cutoffPeak: 3000 });
    synth(b, { ...BASS, amp: 0.55, start: 0, dur: step * 2, midi: 26 });
    kick(b, step * 3, 0.8);
    stabChord(b, step * 3, [49, 52, 56], step * 6, { cutoffPeak: 2500, sustain: 0.5 });
    synth(b, { ...BASS, amp: 0.55, start: step * 3, dur: step * 6, midi: 25 });
  }),
  // End-of-game fanfare: a triumphant stab-and-lead cadence.
  fanfare: () => renderSfx("fanfare", 3.4, (b) => {
    const hits = [[0, [62, 65, 69], 74], [3, [62, 65, 70], 77], [6, [60, 64, 67], 79], [8, [62, 66, 69], 81]];
    hits.forEach(([s, chord, top], i) => {
      const len = i === 3 ? step * 10 : step * 2;
      stabChord(b, s * step, chord, len, i === 3 ? { sustain: 0.6 } : {});
      leadNote(b, s * step, top, len * 0.9);
      synth(b, { ...BASS, amp: 0.45, start: s * step, dur: len, midi: chord[0] - 24 });
      kick(b, s * step, 0.6);
    });
    snare(b, 8 * step, 0.4);
    clap(b, 8 * step, 0.4);
  }, { reverbMix: 0.35 }),
};

// Picking a decade in the lobby: a quick filtered-noise swoosh that rises
// and falls away, panning across the room. One sting for every decade.
SFX["decade-sting"] = () => renderSfx("decade-sting", 0.65, (b) => {
  sweep(b, 0, 0.22, { from: 700, to: 8000, amp: 0.4 });
  sweep(b, 0.2, 0.3, { from: 600, to: 8000, amp: 0.3, rising: false });
}, { reverbMix: 0.3, room: 0.78, fadeOut: 0.15 });

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

// Loudness per file, matched to the assets these replace so the apps'
// existing playback volumes still fit: an RMS target in dBFS, or a peak
// target for the tick (it's mostly silence, so RMS would misjudge it).
// The music's level is what MusicPlayer's 0.11 volume was tuned against.
const LEVELS = {
  "background-loop": { rmsDb: -16.8 },
  correct: { rmsDb: -21 },
  wrong: { rmsDb: -19.5 },
  tick: { peakDb: -14 },
  trombone: { rmsDb: -16 },
  join: { rmsDb: -21 },
  whoosh: { rmsDb: -21 },
  block: { rmsDb: -17 },
  fanfare: { rmsDb: -16 },
  // Pure noise reads louder than tones at the same RMS, so a touch lower.
  "decade-sting": { rmsDb: -18 },
};

// Gentle tape-style saturation, then scale to the loudness target,
// never letting the peak pass -0.5 dBFS.
function finalize(bus, length, { rmsDb, peakDb }) {
  const L = new Float32Array(length);
  const R = new Float32Array(length);
  let max = 1e-9;
  let sum = 0;
  for (let i = 0; i < length; i++) {
    L[i] = Math.tanh(bus.L[i] * 1.3);
    R[i] = Math.tanh(bus.R[i] * 1.3);
    max = Math.max(max, Math.abs(L[i]), Math.abs(R[i]));
    sum += L[i] * L[i] + R[i] * R[i];
  }
  const rms = Math.sqrt(sum / (2 * length)) || 1e-9;
  const ceiling = Math.pow(10, -0.5 / 20);
  const target = rmsDb !== undefined ? Math.pow(10, rmsDb / 20) / rms : Math.pow(10, peakDb / 20) / max;
  const g = Math.min(target, ceiling / max);
  for (let i = 0; i < length; i++) {
    L[i] *= g;
    R[i] *= g;
  }
  return { L, R };
}

function writeWav(path, { L, R }) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  writeFileSync(path, buf);
}

const work = mkdtempSync(join(tmpdir(), "twt-audio-"));
const renders = { "background-loop": renderMusic, ...SFX };
for (const [name, render] of Object.entries(renders)) {
  const wav = join(work, `${name}.wav`);
  const m4a = join(work, `${name}.m4a`);
  writeWav(wav, render());
  execFileSync("afconvert", ["-f", "m4af", "-d", "aac", "-b", name === "background-loop" ? "160000" : "128000", wav, m4a]);
  for (const dir of OUTPUT_DIRS) copyFileSync(m4a, join(dir, `${name}.m4a`));
  console.log(`rendered ${name}.m4a`);
}
console.log(`WAV masters left in ${work}`);
