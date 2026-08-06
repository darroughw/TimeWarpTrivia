"use client";

import { useState, type CSSProperties } from "react";
import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import { DECADE_COLORS } from "@/lib/decadeColors";
import type { BlockCandidate } from "@/lib/types";
import styles from "./BlockChoiceScreen.module.scss";

interface BlockChoiceScreenProps {
  candidates: BlockCandidate[];
  onConfirm: (candidateId: string) => void;
}

export default function BlockChoiceScreen({ candidates, onConfirm }: BlockChoiceScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <div>
        <span className={styles.eyebrow}>You&rsquo;re in Last Place</span>
        <h1 className={styles.title}>Pick one question to block from the Final Round</h1>
      </div>

      <div className={styles.candidates} role="radiogroup" aria-label="Block a question">
        {candidates.map((candidate) => {
          const selected = candidate.id === selectedId;
          const style = { "--decade-color": DECADE_COLORS[candidate.decadeId] } as CSSProperties;
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
              <span className={styles.decadeTag}>{candidate.decadeId}</span>
              <span className={styles.preview}>{candidate.preview}</span>
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
        Confirm Block
      </button>
    </div>
  );
}
