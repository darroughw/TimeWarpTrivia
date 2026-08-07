import Link from "next/link";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import styles from "./SmallScreenNotice.module.scss";

/**
 * Shown instead of the real host flow when useIsLargeScreen says the
 * viewport's too small — a phone (or small tablet) can't serve as "the
 * screen the whole room looks at," so this swaps in before LiveTvFlow/
 * MockTvFlow ever mounts (and before a room gets created for a host
 * session nobody could actually use).
 */
export default function SmallScreenNotice() {
  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <span className={styles.eyebrow}>TimeWarp Trivia</span>
      <h1 className={styles.title}>This needs a bigger stage.</h1>
      <p className={styles.body}>
        The host screen is what the whole room looks at — a TV, a laptop, a monitor. Pull it up on
        one of those. If you&rsquo;re here to play, not host, you&rsquo;re actually in the right
        place.
      </p>
      <Link href="/play" className={styles.joinButton}>
        Join a Game
      </Link>
    </div>
  );
}
