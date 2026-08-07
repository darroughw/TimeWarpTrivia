import styles from "./LogoFooter.module.scss";

/**
 * Small persistent brand mark pinned to the bottom of every phone screen.
 * Relies on being the last child of a `display: flex; flex-direction:
 * column;` container — its own `margin-top: auto` does the pinning, so
 * it never overlaps whatever content came before it.
 */
export default function LogoFooter() {
  return <img src="/logo.svg" alt="TimeWarp Trivia" className={styles.logo} />;
}
