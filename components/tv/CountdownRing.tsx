import styles from "./CountdownRing.module.scss";

interface CountdownRingProps {
  totalSeconds: number;
  secondsRemaining: number;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CountdownRing({ totalSeconds, secondsRemaining }: CountdownRingProps) {
  const clamped = Math.max(0, Math.min(secondsRemaining, totalSeconds));
  const ratio = totalSeconds > 0 ? clamped / totalSeconds : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);
  const urgent = clamped <= 5;

  return (
    <div className={styles.wrap} role="timer" aria-live="polite">
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
    </div>
  );
}
