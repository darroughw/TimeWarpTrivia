"use client";

import { useEffect, useState } from "react";
import { useDpadNavigation } from "@/hooks/useDpadNavigation";
import { submitFeedback } from "@/lib/feedbackService";
import styles from "./FeedbackModal.module.scss";

interface FeedbackModalProps {
  onClose: () => void;
}

type Status = "form" | "submitting" | "sent" | "error";

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const containerRef = useDpadNavigation<HTMLDivElement>();
  const [message, setMessage] = useState("");
  const [categorySuggestion, setCategorySuggestion] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("form");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim() || status === "submitting") return;
    setStatus("submitting");
    try {
      await submitFeedback({ message, categorySuggestion, email });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={containerRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          data-dpad-focusable
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close feedback form"
        >
          ✕
        </button>

        {status === "sent" ? (
          <div className={styles.sentState}>
            <span className={styles.sentIcon} aria-hidden="true">
              📼
            </span>
            <h2 className={styles.title}>Feedback received.</h2>
            <p className={styles.subtitle}>
              We make no promises about when, but someone will actually read this.
            </p>
            <button type="button" data-dpad-focusable className={styles.doneButton} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 id="feedback-modal-title" className={styles.title}>
              Got Feedback?
            </h2>
            <p className={styles.subtitle}>
              Bug, category idea, missing decade, anything. Straight to us, no middleman.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="feedback-message">
                  What&rsquo;s on your mind? <span className={styles.required}>Required</span>
                </label>
                <textarea
                  id="feedback-message"
                  className={styles.textarea}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what worked, what broke, or what's missing…"
                  rows={4}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="feedback-category">
                  Category or decade idea
                </label>
                <input
                  id="feedback-category"
                  className={styles.input}
                  type="text"
                  value={categorySuggestion}
                  onChange={(e) => setCategorySuggestion(e.target.value)}
                  placeholder="e.g. 'Video Games' as its own category"
                  maxLength={200}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="feedback-email">
                  Email, if you want a reply
                </label>
                <input
                  id="feedback-email"
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  maxLength={200}
                />
              </div>

              {status === "error" && (
                <p className={styles.error}>Something went wrong sending that. Try again?</p>
              )}

              <button
                type="submit"
                data-dpad-focusable
                className={styles.submitButton}
                disabled={!message.trim() || status === "submitting"}
              >
                {status === "submitting" ? "Sending…" : "Send Feedback"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
