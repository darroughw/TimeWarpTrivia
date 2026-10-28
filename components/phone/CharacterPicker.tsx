"use client";

import type { CSSProperties } from "react";
import { CHARACTERS, characterForAvatar, characterImageSrc } from "@/lib/characters";
import styles from "./CharacterPicker.module.scss";

interface CharacterPickerProps {
  // The chosen character's emoji (what gets stored in players.avatar).
  value: string | null;
  onChange: (emoji: string) => void;
  // The player's own color, so the picker previews exactly how their
  // avatar will look on the TV.
  color: string;
}

export default function CharacterPicker({ value, onChange, color }: CharacterPickerProps) {
  const selected = value ? characterForAvatar(value) : undefined;

  return (
    <div className={styles.picker} style={{ "--pick-color": color } as CSSProperties}>
      <div className={styles.header}>
        <span className={styles.label} id="character-label">
          Your Character
        </span>
        {selected && <span className={styles.selectedName}>{selected.name}</span>}
      </div>
      <div className={styles.grid} role="radiogroup" aria-labelledby="character-label">
        {CHARACTERS.map((character) => {
          const isSelected = selected?.id === character.id;
          return (
            <button
              key={character.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={character.name}
              className={`${styles.option} ${isSelected ? styles.selected : ""}`}
              onClick={() => onChange(character.emoji)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs; next/image adds nothing here */}
              <img src={characterImageSrc(character)} alt="" draggable={false} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
