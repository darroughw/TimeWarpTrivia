// Speed-based scoring: a correct answer is worth more the faster it's
// submitted. Wrong or unanswered is always 0. Client-computed and
// client-trusted — see README limitations (no server-side validation).
const MIN_POINTS = 50;
const MAX_POINTS = 200;

export function computeScore(
  correct: boolean,
  responseTimeMs: number,
  timeLimitSeconds: number,
): number {
  if (!correct) return 0;
  const timeLimitMs = timeLimitSeconds * 1000;
  const speedRatio = Math.max(0, Math.min(1, 1 - responseTimeMs / timeLimitMs));
  return Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * speedRatio);
}
