"use client";

import { useRef, useState } from "react";
import FeedbackModal from "./FeedbackModal";
import styles from "./FeedbackButton.module.scss";

/** Small tertiary trigger for the feedback/category-suggestion form
 * (TIM-28). Self-contained, same pattern as HelpButton. */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleClose() {
    setOpen(false);
    // The modal unmounts on close, taking focus with it — without this a
    // keyboard/D-pad user lands back on <body> with no sense of where
    // they are, instead of picking up right where they opened the modal.
    triggerRef.current?.focus();
  }

  return (
    <>
      <button ref={triggerRef} type="button" data-dpad-focusable className={styles.button} onClick={() => setOpen(true)}>
        <span className={styles.mark} aria-hidden="true">
          ✎
        </span>
        Feedback
      </button>
      {open && <FeedbackModal onClose={handleClose} />}
    </>
  );
}
