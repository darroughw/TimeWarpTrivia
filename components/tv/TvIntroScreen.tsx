import Link from "next/link";
import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import ScanlineOverlay from "./ScanlineOverlay";
import styles from "./TvIntroScreen.module.scss";

// The Android TV wrapper's actual first screen (see README's Routes
// section) — /host is the game itself and assumes a room should exist
// already, which reads as broken with nothing on screen to explain what
// just launched. This is deliberately barer than the marketing landing
// page (`/`): no join link, no decade strip, no step-by-step — a TV
// remote's first input should be one predictable OK press away.
export default function TvIntroScreen() {
  const containerRef = useDpadNavigation<HTMLDivElement>();

  return (
    <div className={styles.screen} ref={containerRef}>
      <ScanlineOverlay />
      <img src="/logo.svg" alt="TimeWarp Trivia" className={styles.logo} />
      <p className={styles.intro}>
        Six decades of pop culture trivia on the big screen &mdash; everyone else&rsquo;s phone is
        the buzzer.
      </p>
      <Link href="/host" data-dpad-focusable className={styles.startButton}>
        Start
      </Link>
    </div>
  );
}
