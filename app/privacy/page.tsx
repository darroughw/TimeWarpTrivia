import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.scss";

const description = "How TimeWarp Trivia collects, stores, and uses data.";

export const metadata: Metadata = {
  title: "Privacy Policy — TimeWarp Trivia",
  description,
  openGraph: { title: "Privacy Policy — TimeWarp Trivia", description, type: "website" },
};

// Last-updated stamp is manual, not derived from git, so it only moves
// when someone deliberately revises the policy text below.
const LAST_UPDATED = "August 13, 2026";

export default function PrivacyPolicy() {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          &larr; TimeWarp Trivia
        </Link>
      </header>

      <main className={styles.doc}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated {LAST_UPDATED}</p>

        <p>
          This policy covers TimeWarp Trivia at every place you can play it: the website
          (timewarptrivia.com), the phone screens players use to join a game, and the Android TV
          / Fire TV app — which is a thin wrapper around the same website, so the same practices
          below apply there too.
        </p>

        <h2>Information we collect</h2>

        <h3>What you give us directly</h3>
        <ul>
          <li>
            <strong>A nickname.</strong> Required to join or host a game. It&rsquo;s visible to
            everyone else in that game&rsquo;s room and stored with the room&rsquo;s data.
          </li>
          <li>
            <strong>Feedback, optionally.</strong> If you use the in-app feedback form, we store
            whatever you write and, if you choose to include it, your email address so we can
            follow up. Both are optional.
          </li>
        </ul>
        <p>
          There are no user accounts. TimeWarp Trivia has no sign-up, no login, no password, and
          doesn&rsquo;t collect your real name, phone number, address, or any government ID.
        </p>

        <h3>Gameplay data</h3>
        <p>
          Playing a game generates data by nature: the room code, which questions were shown,
          what was answered, how long it took to answer, and the resulting scores. This is stored
          in our database (hosted on Supabase) so the game can run in real time across every
          player&rsquo;s phone and the shared screen.
        </p>

        <h3>Information collected automatically</h3>
        <p>We use a small number of third-party services to keep the app running and working:</p>
        <ul>
          <li>
            <strong>Vercel Analytics &amp; Speed Insights</strong> — aggregate page-visit and
            performance data for the site we host on Vercel.
          </li>
          <li>
            <strong>Sentry</strong> — error and crash reports, so we can find and fix bugs. This
            can include technical details like your browser/device type and what page or action
            triggered the error.
          </li>
          <li>
            <strong>PostHog</strong> — product analytics on gameplay events (e.g. a game started,
            a question was answered) to understand how the game is used. Not active on every
            deployment of this app.
          </li>
        </ul>
        <p>
          Each of these providers may incidentally see standard technical data that any web
          request carries, like IP address, as part of operating their service &mdash; we
          don&rsquo;t separately log or store that ourselves.
        </p>

        <h2>How we use this information</h2>
        <p>
          To run the game itself, to see and fix bugs, to understand which parts of the app get
          used, and to respond if you&rsquo;ve contacted us. We don&rsquo;t sell personal
          information, and we don&rsquo;t use anything collected here for advertising.
        </p>

        <h2>Sharing</h2>
        <p>
          We don&rsquo;t share your information with third parties except the service providers
          named above, who process it on our behalf to run the app. Anyone in your game&rsquo;s
          room can see the nicknames and scores in that room, since that&rsquo;s the point of a
          shared-screen party game.
        </p>

        <h2>Data retention</h2>
        <p>
          Gameplay data (rooms, players, answers) is kept in our database and isn&rsquo;t
          automatically deleted on a fixed schedule. If you&rsquo;d like data tied to a specific
          game or nickname removed, contact us below.
        </p>

        <h2>Children&rsquo;s privacy</h2>
        <p>
          TimeWarp Trivia isn&rsquo;t directed at children under 13, and we don&rsquo;t knowingly
          collect personal information from children under 13. If you believe a child has
          provided us with personal information, contact us and we&rsquo;ll remove it.
        </p>

        <h2>Your choices</h2>
        <p>
          Since there&rsquo;s no account system, there&rsquo;s nothing to log into or delete
          yourself. To ask what data we have tied to a game or nickname, or to request it be
          deleted, email us using the address below.
        </p>

        <h2>Security</h2>
        <p>
          We take reasonable measures to protect the data we store, but no method of transmission
          or storage is completely secure, and we can&rsquo;t guarantee absolute security.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If this policy changes, we&rsquo;ll update the &ldquo;last updated&rdquo; date at the
          top of this page.
        </p>

        <h2>Contact us</h2>
        <p>
          Questions about this policy, or a data access/deletion request? Email{" "}
          <a href="mailto:privacy@timewarptrivia.com">privacy@timewarptrivia.com</a>.
        </p>
      </main>
    </div>
  );
}
