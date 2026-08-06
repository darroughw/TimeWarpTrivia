"use client";

import { useCallback, useEffect, useState } from "react";
import BlockScreen from "@/components/tv/BlockScreen";
import EndGameScreen from "@/components/tv/EndGameScreen";
import LobbyScreen from "@/components/tv/LobbyScreen";
import PassiveAdvanceHint from "@/components/tv/PassiveAdvanceHint";
import QuestionScreen from "@/components/tv/QuestionScreen";
import RoundTransitionScreen from "@/components/tv/RoundTransitionScreen";
import ScoreboardScreen from "@/components/tv/ScoreboardScreen";
import LoadingState from "@/components/shared/LoadingState";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { playerRowToPlayer } from "@/lib/avatar";
import type { AnswerRow, RoomStatus } from "@/lib/database.types";
import {
  MOCK_BLOCK_CANDIDATE_QUESTIONS,
  MOCK_FINAL_QUESTION,
  MOCK_QUESTION,
  getQuestionById,
} from "@/lib/mockData";
import { createRoom, updateRoom, setDecadeFilter } from "@/lib/roomService";
import { computeScore } from "@/lib/scoring";
import { supabase } from "@/lib/supabaseClient";
import type { PlayerPointResult, RoundResult } from "@/lib/types";

// Reveal screens the host paces manually with Enter/→. "block" is
// deliberately absent — that transition is triggered externally, by
// whichever phone is the lowest scorer picking their solo question.
const PASSIVE_ADVANCE: Partial<Record<RoomStatus, RoomStatus>> = {
  transition: "scoreboard",
  scoreboard: "block",
  soloTransition: "finalQuestion",
  finalTransition: "end",
};

const NEXT_ROUND_LABEL: Partial<Record<RoomStatus, string>> = {
  question: "Scoreboard",
  soloQuestion: "Final Round",
  finalQuestion: "Final Results",
};

export default function LiveTvFlow() {
  const [hostId] = useState(() => crypto.randomUUID());
  const [roomId, setRoomId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);

  const { room, players: playerRows } = useRoomRealtime(roomId);
  const players = playerRows.map(playerRowToPlayer);

  // Create a fresh room the moment the TV boots up.
  useEffect(() => {
    let cancelled = false;
    createRoom(hostId).then((newRoom) => {
      if (!cancelled) setRoomId(newRoom.id);
    });
    return () => {
      cancelled = true;
    };
  }, [hostId]);

  // Every submitted answer for this room, live — used for the "X of Y
  // answered" counter and to build each question's results breakdown.
  useEffect(() => {
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

  const handleAdvance = useCallback(() => {
    if (!room) return;
    const next = PASSIVE_ADVANCE[room.status];
    if (!next) return;
    // The one passive transition that also needs to point at a new
    // question — every other one keeps current_question_id as-is.
    if (next === "finalQuestion") {
      updateRoom(room.id, { status: next, current_question_id: MOCK_FINAL_QUESTION.id, current_round: 4 });
    } else {
      updateRoom(room.id, { status: next });
    }
  }, [room]);

  useEffect(() => {
    if (!room || !PASSIVE_ADVANCE[room.status]) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleAdvance();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [room, handleAdvance]);

  async function handlePlayAgain() {
    setLastRoundResult(null);
    setAnswers([]);
    const newRoom = await createRoom(hostId);
    setRoomId(newRoom.id);
  }

  // Builds the results breakdown for whichever question just ended, purely
  // from the answers we've already collected — each phone already applied
  // its own score to its own player row when it answered (see
  // lib/roomService.submitAnswer), so this is for *display* only.
  async function handleQuestionTimeUp(nextStatus: RoomStatus) {
    if (!room?.current_question_id) return;
    const question = getQuestionById(room.current_question_id);
    if (!question) return;

    const relevantAnswers = answers.filter((a) => a.question_id === room.current_question_id);
    const participants =
      room.status === "soloQuestion" ? players.filter((p) => p.id === room.blocker_player_id) : players;

    const results: PlayerPointResult[] = participants.map((p) => {
      const answer = relevantAnswers.find((a) => a.player_id === p.id);
      if (!answer) return { playerId: p.id, pointsGained: 0, correct: false, answeredIndex: null };
      const correct = answer.answer === question.correctIndex;
      return {
        playerId: p.id,
        pointsGained: computeScore(correct, answer.response_time_ms, question.timeLimitSeconds),
        correct,
        answeredIndex: answer.answer,
      };
    });

    setLastRoundResult({ question, results, nextRoundLabel: NEXT_ROUND_LABEL[room.status] ?? "" });
    await updateRoom(room.id, { status: nextStatus });
  }

  if (!room) return <LoadingState message="Creating room…" />;

  const currentQuestion = room.current_question_id ? getQuestionById(room.current_question_id) : undefined;
  const answeredCount = currentQuestion
    ? answers.filter((a) => a.question_id === room.current_question_id).length
    : 0;
  const soloPlayer = players.find((p) => p.id === room.blocker_player_id);

  return (
    <>
      {room.status === "lobby" && (
        <LobbyScreen
          roomCode={room.code}
          players={players}
          selectedDecade={room.decade_filter}
          onSelectDecade={(id) => setDecadeFilter(room.id, id)}
          onStartGame={() =>
            updateRoom(room.id, { status: "question", current_round: 3, current_question_id: MOCK_QUESTION.id })
          }
        />
      )}

      {room.status === "question" && currentQuestion && (
        <QuestionScreen
          question={currentQuestion}
          totalPlayers={players.length}
          answeredCount={answeredCount}
          onTimeUp={() => handleQuestionTimeUp("transition")}
        />
      )}

      {room.status === "transition" && lastRoundResult && (
        <RoundTransitionScreen result={lastRoundResult} players={players} />
      )}

      {room.status === "scoreboard" && (
        <ScoreboardScreen players={players} roundLabel={currentQuestion?.roundLabel ?? ""} />
      )}

      {room.status === "block" && <BlockScreen players={players} candidates={MOCK_BLOCK_CANDIDATE_QUESTIONS} />}

      {room.status === "soloQuestion" && currentQuestion && soloPlayer && (
        <QuestionScreen
          question={currentQuestion}
          totalPlayers={players.length}
          soloPlayer={soloPlayer}
          answeredCount={answeredCount}
          onTimeUp={() => handleQuestionTimeUp("soloTransition")}
        />
      )}

      {room.status === "soloTransition" && lastRoundResult && (
        <RoundTransitionScreen result={lastRoundResult} players={players} />
      )}

      {room.status === "finalQuestion" && currentQuestion && (
        <QuestionScreen
          question={currentQuestion}
          totalPlayers={players.length}
          answeredCount={answeredCount}
          onTimeUp={() => handleQuestionTimeUp("finalTransition")}
        />
      )}

      {room.status === "finalTransition" && lastRoundResult && (
        <RoundTransitionScreen result={lastRoundResult} players={players} />
      )}

      {room.status === "end" && <EndGameScreen players={players} onPlayAgain={handlePlayAgain} />}

      {PASSIVE_ADVANCE[room.status] && <PassiveAdvanceHint />}
    </>
  );
}
