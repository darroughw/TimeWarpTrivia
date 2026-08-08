import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import LogoFooter from "./LogoFooter";
import styles from "./RemovedFromGameScreen.module.scss";

/** Shown to a player after the host removes them (TIM-35) — their phone
 * stops being able to answer from this point on. */
export default function RemovedFromGameScreen() {
  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div className={styles.icon} aria-hidden="true">
        👋
      </div>
      <h1 className={styles.title}>You&rsquo;ve been removed from this game.</h1>
      <p className={styles.status}>The host handled it. Take it up with them.</p>

      <LogoFooter />
    </div>
  );
}
