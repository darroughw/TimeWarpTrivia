"use client";

import { useState, type CSSProperties } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { DECADE_COLORS } from "@/lib/decadeColors";
import type { Question } from "@/lib/types";
import LogoFooter from "./LogoFooter";
import styles from "./BlockChoiceScreen.module.scss";

interface BlockChoiceScreenProps {
  candidates: Question[];
  onConfirm: (questionId: string) => void;
}

export default function BlockChoiceScreen({ candidates, onConfirm }: BlockChoiceScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div>
        <span className={styles.eyebrow}>You&rsquo;re in Last Place</span>
        <h1 className={styles.title}>Pick one question to answer on your own</h1>
        <p className={styles.subtitle}>
          Only you can answer it. Everyone else just watches. Get it right, and it scores like
          any other question.
        </p>
      </div>

      <div className={styles.candidates} role="radiogroup" aria-label="Pick a question to answer solo">
        {candidates.map((candidate) => {
          const selected = candidate.id === selectedId;
          // Deep Cuts questions (TIM-41) have no decade — every
          // candidate shares the same topic anyway, so a per-candidate
          // tag would be redundant even if there were a color to show.
          const style = candidate.decadeId
            ? ({ "--decade-color": DECADE_COLORS[candidate.decadeId] } as CSSProperties)
            : undefined;
          return (
            <button
              key={candidate.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`${styles.candidate} ${selected ? styles.selected : ""}`}
              style={style}
              onClick={() => setSelectedId(candidate.id)}
            >
              {candidate.decadeId && <span className={styles.decadeTag}>{candidate.decadeId}</span>}
              <span className={styles.preview}>{candidate.text}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.confirmButton}
        disabled={!selectedId}
        onClick={() => selectedId && onConfirm(selectedId)}
      >
        Answer This One
      </button>

      <LogoFooter />
    </div>
  );
}
