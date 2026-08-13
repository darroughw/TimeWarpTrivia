import styles from "./SimulatorBadge.module.scss";

/** Persistent "this isn't a real game" marker for the Konami-code demo simulator. */
export default function SimulatorBadge() {
  return (
    <div className={styles.badge}>
      <span className={styles.dot} aria-hidden="true" />
      Demo Mode
    </div>
  );
}
