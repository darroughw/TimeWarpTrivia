import styles from "./LogoFooter.module.scss";

/**
 * Small persistent brand mark pinned to the bottom of every phone screen.
 * Relies on being the last child of a `display: flex; flex-direction:
 * column;` container — its own `margin-top: auto` does the pinning, so
 * it never overlaps whatever content came before it.
 */
export default function LogoFooter() {
  // The landing page's own logo uses next/image, but only for
  // `priority`/explicit-dimensions LCP hints that matter on a page Google
  // actually indexes; phone routes are excluded from robots.txt/sitemap.xml
  // (they create a real player row on load), so there's no CWV score to
  // protect, and it's still `unoptimized` SVG either way.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" alt="TimeWarp Trivia" className={styles.logo} />;
}
