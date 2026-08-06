import type { CSSProperties } from "react";
import { DECADE_COLORS } from "@/lib/decadeColors";
import type { Decade, DecadeId } from "@/lib/types";
import styles from "./DecadeFilter.module.scss";

interface DecadeFilterProps {
  decades: Decade[];
  selectedId: DecadeId;
  onSelect: (id: DecadeId) => void;
}

export default function DecadeFilter({ decades, selectedId, onSelect }: DecadeFilterProps) {
  return (
    <div className={styles.row} role="radiogroup" aria-label="Decade filter">
      {decades.map((decade) => {
        const selected = decade.id === selectedId;
        const style = { "--decade-color": DECADE_COLORS[decade.id] } as CSSProperties;
        return (
          <button
            key={decade.id}
            type="button"
            data-dpad-focusable
            role="radio"
            aria-checked={selected}
            className={`${styles.pill} ${selected ? styles.selected : ""}`}
            style={style}
            onClick={() => onSelect(decade.id)}
          >
            {decade.label}
          </button>
        );
      })}
    </div>
  );
}
