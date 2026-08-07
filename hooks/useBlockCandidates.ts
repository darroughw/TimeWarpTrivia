"use client";

import { useEffect, useState } from "react";
import type { RoomRow } from "@/lib/database.types";
import { fetchQuestionsByIds } from "@/lib/questionService";
import type { Question } from "@/lib/types";

// Resolves room.block_candidate_ids into the 3 solo-question Question
// rows, refetching whenever the id list changes. Shared by LiveTvFlow
// (renders them on BlockScreen) and LivePlayFlow (renders them on
// BlockChoiceScreen for the lowest scorer to pick from).
export function useBlockCandidates(room: RoomRow | null): Question[] {
  const [candidates, setCandidates] = useState<Question[]>([]);

  useEffect(() => {
    const ids = room?.block_candidate_ids ?? [];
    if (ids.length === 0) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    fetchQuestionsByIds(ids, { roundLabel: "Solo Round", timeLimitSeconds: 15 }).then((qs) => {
      if (!cancelled) setCandidates(qs);
    });
    return () => {
      cancelled = true;
    };
  }, [room?.block_candidate_ids]);

  return candidates;
}
