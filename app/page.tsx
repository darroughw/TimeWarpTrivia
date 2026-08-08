import Link from "next/link";
import type { CSSProperties } from "react";
import HelpButton from "@/components/shared/HelpButton";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { DECADE_COLORS } from "@/lib/decadeColors";
import type { DecadeId } from "@/lib/types";
import styles from "./page.module.scss";

// The four playable decades, in order — "all" is a filter option, not a
// decade in its own right, so it's excluded from this purely decorative
// strip. Colors come from the same DECADE_COLORS map the live app uses.
const DECADE_STRIP: DecadeId[] = ["80s", "90s", "2000s", "2010s"];

const STEPS = [
  {
    title: "Host picks a decade",
    body: "Put it on the big screen: TV, laptop, whatever's around. Once you're in the lobby, filter to one decade or open it up to all four.",
  },
  {
    title: "Everyone joins from their phone",
    body: "No app, no download. Just a room code and a name. 2 to 10 players.",
  },
  {
    title: "Answer fast, answer right",
    body: "3 rounds, a merciless final twist for whoever's in last, and a scoreboard that remembers everything.",
  },
];

export default function Landing() {
  return (
    <div className={styles.screen}>
      <ScanlineOverlay />

      <header className={styles.header}>
        <img src="/logo.svg" alt="TimeWarp Trivia" className={styles.logo} />
        <Link href="/play" className={styles.joinLink}>
          Join a Game
        </Link>
      </header>

      <main className={styles.hero}>
        <h1 className={styles.title}>Nostalgia, weaponized.</h1>
        <p className={styles.subtitle}>
          Four decades of pop culture trivia on one shared screen, everyone else&rsquo;s phone as
          the buzzer. Answer fast, answer right, or don&rsquo;t. We&rsquo;ll remember either way.
        </p>

        <div className={styles.decadeStrip} aria-hidden="true">
          {DECADE_STRIP.map((decade) => (
            <span
              key={decade}
              className={styles.decadeSegment}
              style={{ "--decade-color": DECADE_COLORS[decade] } as CSSProperties}
            >
              {decade}
            </span>
          ))}
        </div>
        <p className={styles.stripCaption}>
          Every era&rsquo;s in play. Your host filters to one (or all four) once the lobby&rsquo;s
          open.
        </p>

        <Link href="/host" className={styles.hostButton}>
          Host a Game
        </Link>
        <p className={styles.playerNote}>
          Best with 2&ndash;10 players. Everyone else just needs a phone and something to prove.
        </p>
      </main>

      <section className={styles.steps} aria-label="How it works">
        {STEPS.map((step, index) => (
          <div className={styles.step} key={step.title}>
            <span className={styles.stepNumber}>{index + 1}</span>
            <div>
              <h2 className={styles.stepTitle}>{step.title}</h2>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className={styles.footer}>
        <HelpButton />
      </footer>
    </div>
  );
}
