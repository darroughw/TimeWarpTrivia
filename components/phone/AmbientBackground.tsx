import styles from "./AmbientBackground.module.scss";

/** Slow-drifting color glow behind every phone screen. Purely decorative. */
export default function AmbientBackground() {
  return (
    <div className={styles.ambient} aria-hidden="true">
      <div className={`${styles.blob} ${styles.accent}`} />
      <div className={`${styles.blob} ${styles.violet}`} />
      <div className={`${styles.blob} ${styles.blue}`} />
    </div>
  );
}
