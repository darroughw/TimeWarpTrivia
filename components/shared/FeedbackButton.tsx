"use client";

import { useState } from "react";
import FeedbackModal from "./FeedbackModal";
import styles from "./FeedbackButton.module.scss";

/** Small tertiary trigger for the feedback/category-suggestion form
 * (TIM-28). Self-contained, same pattern as HelpButton. */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" data-dpad-focusable className={styles.button} onClick={() => setOpen(true)}>
        <span className={styles.mark} aria-hidden="true">
          ✎
        </span>
        Feedback
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}
