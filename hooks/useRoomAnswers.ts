"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { AnswerRow } from "@/lib/database.types";

interface RoomAnswers {
  answers: AnswerRow[];
  // For a same-room rematch (Play Again): the DB rows get deleted
  // server-side via clearRoomAnswers, but this hook only listens for
  // INSERT events, so it wouldn't otherwise notice they're gone. Callers
  // doing that reset should call this right after.
  clearAnswers: () => void;
}

// Every submitted answer for a room, live — used for the "X of Y answered"
// counter and to build each question's results breakdown. Shared by
// LiveTvFlow and SimulatorTvFlow, which both need the same reactive view.
export function useRoomAnswers(roomId: string | null): RoomAnswers {
  const [answers, setAnswers] = useState<AnswerRow[]>([]);

  useEffect(() => {
    // Clear synchronously on every roomId change, not just to null — a
    // fresh room (e.g. Cancel Game) starts with no answers, and without
    // this the previous room's answers would flash on screen until the
    // new room's fetch below resolves.
    setAnswers([]);
    if (!roomId) return;
    let cancelled = false;

    supabase
      .from("answers")
      .select("*")
      .eq("room_id", roomId)
      .then(({ data }) => {
        if (!cancelled && data) setAnswers(data as AnswerRow[]);
      });

    const channel = supabase
      .channel(`answers-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const inserted = payload.new as AnswerRow;
          setAnswers((current) => (current.some((a) => a.id === inserted.id) ? current : [...current, inserted]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { answers, clearAnswers: () => setAnswers([]) };
}
