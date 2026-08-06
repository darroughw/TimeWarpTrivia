import styles from "./ScanlineOverlay.module.scss";

/** Ambient CRT scanline texture. Drop into any screen's root — purely decorative. */
export default function ScanlineOverlay() {
  return <div className={styles.overlay} aria-hidden="true" />;
}
