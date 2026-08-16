"use client";

import { useState } from "react";
import styles from "./ShareButton.module.scss";

const SHARE_DATA = {
  title: "TimeWarp Trivia",
  text: "Grab your phone and join a decade-hopping trivia game on the big screen.",
};

/** Small tertiary footer action, same pattern as HelpButton/FeedbackButton.
 * Uses the native share sheet where available (mobile browsers); falls
 * back to copying the page URL to the clipboard on desktop browsers that
 * don't implement the Web Share API, with a brief "Copied!" confirmation
 * instead of a silent no-op. */
export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ ...SHARE_DATA, url });
      } catch {
        // User dismissed the share sheet — not an error, nothing to do.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" data-dpad-focusable className={styles.button} onClick={handleShare}>
      <span className={styles.mark} aria-hidden="true">
        ↗
      </span>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
