"use client";

import { useEffect } from "react";
import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import { HOSTING_STEPS, PLAYING_STEPS, type HelpStep } from "@/lib/helpContent";
import HelpIcon from "./HelpIcons";
import styles from "./HelpModal.module.scss";

interface HelpModalProps {
  onClose: () => void;
}

function StepTrack({ label, steps }: { label: string; steps: HelpStep[] }) {
  return (
    <section className={styles.track}>
      <h3 className={styles.trackLabel}>{label}</h3>
      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.stepBadge}>
              <HelpIcon name={step.icon} className={styles.stepIcon} />
              <span className={styles.stepNumber}>{index + 1}</span>
            </span>
            <div>
              <h4 className={styles.stepTitle}>{step.title}</h4>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function HelpModal({ onClose }: HelpModalProps) {
  const containerRef = useDpadNavigation<HTMLDivElement>();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={containerRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          data-dpad-focusable
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close help"
        >
          ✕
        </button>

        <h2 id="help-modal-title" className={styles.title}>
          How to Play
        </h2>
        <p className={styles.subtitle}>
          One shared screen for the room. Everyone else&rsquo;s phone as the buzzer.
        </p>

        <div className={styles.tracks}>
          <StepTrack label="Hosting" steps={HOSTING_STEPS} />
          <StepTrack label="Joining & Playing" steps={PLAYING_STEPS} />
        </div>
      </div>
    </div>
  );
}
