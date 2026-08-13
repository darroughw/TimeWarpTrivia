"use client";

import { useRef, useState } from "react";
import HelpModal from "./HelpModal";
import styles from "./HelpButton.module.scss";

/** Small tertiary trigger for the illustrated how-to-play modal (TIM-39).
 * Self-contained — drop it anywhere and it manages its own open state. */
export default function HelpButton() {
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
          ?
        </span>
        Help
      </button>
      {open && <HelpModal onClose={handleClose} />}
    </>
  );
}
