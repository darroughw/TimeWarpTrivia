import { pointsRemaining } from "@/lib/scoring";
import styles from "./CountdownRing.module.scss";

interface CountdownRingProps {
  totalSeconds: number;
  secondsRemaining: number;
  // "lg" (default) is the TV's 10-foot size; "sm" is a compact variant
  // sized for the phone controller's QuestionScreen.
  size?: "lg" | "sm";
  // 2 during the final round (Double Points) so the live readout matches
  // what a correct answer actually pays out.
  pointsMultiplier?: number;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CountdownRing({
  totalSeconds,
  secondsRemaining,
  size = "lg",
  pointsMultiplier = 1,
}: CountdownRingProps) {
  const clamped = Math.max(0, Math.min(secondsRemaining, totalSeconds));
  const ratio = totalSeconds > 0 ? clamped / totalSeconds : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);
  const urgent = clamped <= 5;
  const points = pointsRemaining(clamped, totalSeconds, pointsMultiplier);

  return (
    // Ticks every second — deliberately not an aria-live region, that
    // cadence would spam a screen reader with a new announcement every
    // second for the whole question. Scores are already read out on the
    // results screen once the question ends.
    <div className={`${styles.wrap} ${size === "sm" ? styles.sm : ""}`} aria-hidden="true">
      <svg className={styles.svg} viewBox="0 0 100 100">
        <circle className={styles.track} cx="50" cy="50" r={RADIUS} />
        <circle
          className={`${styles.progress} ${urgent ? styles.urgent : ""}`}
          cx="50"
          cy="50"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.readout}>
        <span className={`${styles.seconds} ${urgent ? styles.urgent : ""}`}>{clamped}</span>
        <span className={styles.label}>sec</span>
      </div>
      <div className={styles.points}>{points} pts</div>
    </div>
  );
}
