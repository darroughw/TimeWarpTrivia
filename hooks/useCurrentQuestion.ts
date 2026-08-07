"use client";

import { useEffect, useState } from "react";
import type { RoomRow } from "@/lib/database.types";
import { fetchQuestionById, questionMetaForRoom } from "@/lib/questionService";
import type { Question } from "@/lib/types";

// Resolves room.current_question_id into a full Question row, refetching
// whenever the id changes. Both LiveTvFlow and LivePlayFlow need this
// same behavior, so it lives here rather than being duplicated in both.
export function useCurrentQuestion(room: RoomRow | null): Question | null {
  const [question, setQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (!room?.current_question_id) {
      setQuestion(null);
      return;
    }
    const meta = questionMetaForRoom(room, room.current_question_id);
    let cancelled = false;
    fetchQuestionById(room.current_question_id, meta).then((q) => {
      if (!cancelled) setQuestion(q);
    });
    return () => {
      cancelled = true;
    };
  }, [room?.current_question_id, room?.question_ids, room?.block_candidate_ids]);

  return question;
}
