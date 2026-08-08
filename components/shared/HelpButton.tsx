"use client";

import { useState } from "react";
import HelpModal from "./HelpModal";
import styles from "./HelpButton.module.scss";

/** Small tertiary trigger for the illustrated how-to-play modal (TIM-39).
 * Self-contained — drop it anywhere and it manages its own open state. */
export default function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" data-dpad-focusable className={styles.button} onClick={() => setOpen(true)}>
        <span className={styles.mark} aria-hidden="true">
          ?
        </span>
        Help
      </button>
      {open && <HelpModal onClose={() => setOpen(false)} />}
    </>
  );
}
