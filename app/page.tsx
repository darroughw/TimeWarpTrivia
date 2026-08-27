import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import FeedbackButton from "@/components/shared/FeedbackButton";
import HelpButton from "@/components/shared/HelpButton";
import ShareButton from "@/components/shared/ShareButton";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { DECADE_COLORS } from "@/lib/decadeColors";
import type { DecadeId } from "@/lib/types";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// The six playable decades, in order — "all" is a filter option, not a
// decade in its own right, so it's excluded from this purely decorative
// strip. Colors come from the same DECADE_COLORS map the live app uses.
const DECADE_STRIP: DecadeId[] = ["60s", "70s", "80s", "90s", "2000s", "2010s"];

const STEPS = [
  {
    title: "Host picks a decade",
    body: "Put it on the big screen: TV, laptop, whatever's around. Once you're in the lobby, filter to one decade or open it up to all six.",
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

// Doubles as the visible FAQ section's content and the FAQPage structured
// data below — Google (and any LLM crawler) requires the two to match, so
// this array is the single source of truth for both.
const FAQ = [
  {
    q: "Which decades can we play?",
    a: "60s, 70s, 80s, 90s, 2000s, 2010s, or All Decades if the room can't agree on one era. The host picks it in the lobby.",
  },
  {
    q: "What categories show up?",
    a: "Music, TV, Movies, and Fashion across every decade, plus Slang/Catchphrases and Advertising for 80s and later. 60s and 70s trade those two for Sports, News & Events, Celebrities, and (60s only) the Space Race — they predate Trapper Keepers, cut them some slack.",
  },
  {
    q: "How does scoring work?",
    a: "Speed-based. A correct answer is worth 1000 points, decaying down to 500 the longer you take. Wrong or missed answers score zero — no penalties. The final round doubles everything.",
  },
  {
    q: 'What’s "the block"?',
    a: "Before the final round, whoever's in last place picks one question to answer completely alone — everyone else just watches. Get it right and you're back in it.",
  },
  {
    q: "Is there a mode besides picking a decade?",
    a: "Deep Cuts — instead of an era, the host picks one specific topic (currently The West Wing or Fallout) and every question comes from that world instead.",
  },
  {
    q: "Is it free?",
    a: "Yes, in any browser, no account required. There are also native Android TV and Amazon Fire TV apps if you'd rather not run a browser tab on your television.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "TimeWarp Trivia",
      description:
        "Decade-hopping party trivia. Host on the big screen, everyone else plays from their phone.",
      applicationCategory: "GameApplication",
      operatingSystem: "Web, Android TV, Amazon Fire TV",
      url: "https://www.timewarptrivia.com",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: {
          "@type": "Answer",
          text: a,
        },
      })),
    },
  ],
};

export default function Landing() {
  return (
    <div className={styles.screen}>
      {/* eslint-disable-next-line react/no-danger -- static, hardcoded structured data, nothing user-controlled */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ScanlineOverlay />

      <header className={styles.header}>
        <Image
          src="/logo.svg"
          alt="TimeWarp Trivia"
          width={425}
          height={392}
          className={styles.logo}
          priority
          unoptimized
        />
        <Link href="/play" className={styles.joinLink}>
          Join a Game
        </Link>
      </header>

      <main className={styles.hero}>
        <h1 className={styles.title}>Nostalgia, weaponized.</h1>
        <p className={styles.subtitle}>
          Six decades of pop culture trivia on one shared screen, everyone else&rsquo;s phone as
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
          Every era&rsquo;s in play. Your host filters to one (or all six) once the lobby&rsquo;s
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

      <section className={styles.deepCuts} aria-labelledby="deep-cuts-heading">
        <Image
          src="/logo-deepcuts.svg"
          alt="Deep Cuts"
          width={425}
          height={392}
          className={styles.deepCutsLogo}
          unoptimized
        />
        <div>
          <h2 id="deep-cuts-heading" className={styles.deepCutsHeading}>
            Bored of eras? Pick a rabbit hole instead.
          </h2>
          <p className={styles.deepCutsBody}>
            Deep Cuts swaps the decade filter for one specific universe &mdash; The West Wing,
            Fallout, more on the way &mdash; and runs the exact same game underneath. Same
            rounds, same block, same brutal final twist.
          </p>
          <Link href="/deepcuts" className={styles.deepCutsButton}>
            Try Deep Cuts
          </Link>
        </div>
      </section>

      <section className={styles.faq} aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={styles.faqHeading}>
          Questions, answered
        </h2>
        {FAQ.map((item) => (
          <div className={styles.faqItem} key={item.q}>
            <h3 className={styles.faqQuestion}>{item.q}</h3>
            <p className={styles.faqAnswer}>{item.a}</p>
          </div>
        ))}
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <HelpButton />
          <FeedbackButton />
          <ShareButton />
          <Link href="/privacy" className={styles.privacyLink}>
            Privacy Policy
          </Link>
        </div>
        <a
          href="https://www.amazon.com/dp/B0HF79BZ3L"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.storeBadgeLink}
        >
          <Image
            src="/amazon-appstore-badge.png"
            alt="Available at Amazon Appstore"
            width={572}
            height={168}
            className={styles.storeBadge}
          />
        </a>
        <p className={styles.copyright}>&copy; {new Date().getFullYear()} TimeWarp Trivia</p>
      </footer>
    </div>
  );
}
