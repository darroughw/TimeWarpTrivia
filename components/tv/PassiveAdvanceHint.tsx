import styles from "./PassiveAdvanceHint.module.scss";

/** The "press → or Enter to continue" hint shown on passive reveal screens. */
export default function PassiveAdvanceHint() {
  return (
    <div className={styles.hint}>
      Press <span className={styles.hintKey}>&rarr;</span> or{" "}
      <span className={styles.hintKey}>Enter</span> to continue
    </div>
  );
}
