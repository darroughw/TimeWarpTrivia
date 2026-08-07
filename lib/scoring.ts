// Speed-based scoring: a correct answer is worth more the faster it's
// submitted. Wrong or unanswered is always 0. Client-computed and
// client-trusted — see README limitations (no server-side validation).
const MIN_POINTS = 50;
const MAX_POINTS = 200;

function pointsForRatio(speedRatio: number, multiplier: number): number {
  const clamped = Math.max(0, Math.min(1, speedRatio));
  return Math.round((MIN_POINTS + (MAX_POINTS - MIN_POINTS) * clamped) * multiplier);
}

export function computeScore(
  correct: boolean,
  responseTimeMs: number,
  timeLimitSeconds: number,
  multiplier = 1,
): number {
  if (!correct) return 0;
  const timeLimitMs = timeLimitSeconds * 1000;
  return pointsForRatio(1 - responseTimeMs / timeLimitMs, multiplier);
}

// What a correct answer would be worth *right now* — same decay curve as
// computeScore, but driven by the countdown's whole-second remaining value
// instead of an actual response time. Used to show the point value ticking
// down live on the timer, so players can see exactly what waiting costs
// them.
export function pointsRemaining(secondsRemaining: number, timeLimitSeconds: number, multiplier = 1): number {
  return pointsForRatio(timeLimitSeconds > 0 ? secondsRemaining / timeLimitSeconds : 0, multiplier);
}
