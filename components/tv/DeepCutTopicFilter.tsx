import type { CSSProperties } from "react";
import { DEEP_CUT_TOPIC_COLORS, DEFAULT_DEEP_CUT_COLOR } from "@/lib/deepCutColors";
import type { DeepCutTopic } from "@/lib/types";
import styles from "./DeepCutTopicFilter.module.scss";

interface DeepCutTopicFilterProps {
  topics: DeepCutTopic[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Structural copy of DecadeFilter — same radio-pill pattern — but no
// "All" option (TIM-41: Deep Cuts topics don't mix, unlike decades).
export default function DeepCutTopicFilter({ topics, selectedId, onSelect }: DeepCutTopicFilterProps) {
  return (
    <div className={styles.row} role="radiogroup" aria-label="Deep Cuts topic">
      {topics.map((topic) => {
        const selected = topic.id === selectedId;
        const style = { "--topic-color": DEEP_CUT_TOPIC_COLORS[topic.id] ?? DEFAULT_DEEP_CUT_COLOR } as CSSProperties;
        return (
          <button
            key={topic.id}
            type="button"
            data-dpad-focusable
            role="radio"
            aria-checked={selected}
            className={`${styles.pill} ${selected ? styles.selected : ""}`}
            style={style}
            onClick={() => onSelect(topic.id)}
          >
            {topic.label}
          </button>
        );
      })}
    </div>
  );
}
