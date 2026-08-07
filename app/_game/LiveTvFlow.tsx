"use client";

import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";
import BlockScreen from "@/components/tv/BlockScreen";
import EndGameScreen from "@/components/tv/EndGameScreen";
import LobbyScreen from "@/components/tv/LobbyScreen";
import PassiveAdvanceHint from "@/components/tv/PassiveAdvanceHint";
import QuestionScreen from "@/components/tv/QuestionScreen";
import RoundStartScreen from "@/components/tv/RoundStartScreen";
import RoundTransitionScreen from "@/components/tv/RoundTransitionScreen";
import ScoreboardScreen from "@/components/tv/ScoreboardScreen";
import LoadingState from "@/components/shared/LoadingState";
import { useBlockCandidates } from "@/hooks/useBlockCandidates";
import { useCountdown } from "@/hooks/useCountdown";
import { useCurrentQuestion } from "@/hooks/useCurrentQuestion";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { playerRowToPlayer } from "@/lib/avatar";
import type { AnswerRow, RoomStatus } from "@/lib/database.types";
import { ALL_DECADES_OPTION } from "@/lib/decadeColors";
import { fetchDecades, fetchRandomQuestionSet } from "@/lib/questionService";
import { createRoom, updateRoom, setDecadeFilter } from "@/lib/roomService";
import { computeScore } from "@/lib/scoring";
import { supabase } from "@/lib/supabaseClient";
import { ROUND_START_COUNTDOWN_SECONDS, type Decade, type PlayerPointResult, type RoundResult } from "@/lib/types";

// 3 rounds of 5 questions each, in question_ids: round 1 = [0,5), round
// 2 = [5,10), round 3 (final, double points) = [10,15). Which round is
// "live" is always derived from question_index — see
// lib/questionService.questionMetaForRoom, the single source of truth
// this mirrors.
const QUESTIONS_PER_ROUND = 5;
const TOTAL_MAIN_QUESTIONS = QUESTIONS_PER_ROUND * 3;

interface PassiveStep {
  status: RoomStatus;
  questionIndex?: number;
}

// What comes next from a "passive" stage — one the host advances manually
// with Enter/→ — given the room's current status and question_index.
// Unlike the old flat status->status map, "what's next" now depends on
// *where in the question sequence* the room is, not just its status.
function nextPassiveStep(fromStatus: RoomStatus, questionIndex: number | null): PassiveStep | null {
  switch (fromStatus) {
    case "transition": {
      if (questionIndex === null) return null;
      if (questionIndex === TOTAL_MAIN_QUESTIONS - 1) return { status: "end" }; // last question of round 3
      if (questionIndex % QUESTIONS_PER_ROUND === QUESTIONS_PER_ROUND - 1) return { status: "scoreboard" }; // last of round 1 or 2
      return { status: "question", questionIndex: questionIndex + 1 };
    }
    case "scoreboard": {
      if (questionIndex === null) return null;
      const justFinishedRound = Math.floor(questionIndex / QUESTIONS_PER_ROUND) + 1;
      if (justFinishedRound === 1) return { status: "countdown", questionIndex: QUESTIONS_PER_ROUND };
      if (justFinishedRound === 2) return { status: "block" }; // block happens once, right before round 3
      return null;
    }
    case "soloTransition":
      // Round 3 / final starts here, after a beat to let everyone regroup.
      return { status: "countdown", questionIndex: QUESTIONS_PER_ROUND * 2 };
    default:
      return null;
  }
}

function labelForStep(step: PassiveStep | null): string {
  if (!step) return "";
  if (step.status === "question" || step.status === "countdown") {
    const round = Math.floor((step.questionIndex ?? 0) / QUESTIONS_PER_ROUND) + 1;
    return round === 3 ? "Final Round" : `Round ${round}`;
  }
  if (step.status === "scoreboard") return "Scoreboard";
  if (step.status === "block") return "Block Round";
  if (step.status === "end") return "Final Results";
  return "";
}

// Stages the host paces manually with Enter/→. "block" is deliberately
// absent — that transition is triggered externally, by whichever phone
// is the lowest scorer picking their solo question.
const PASSIVE_STATUSES: RoomStatus[] = ["transition", "scoreboard", "soloTransition"];

export default function LiveTvFlow() {
  const [hostId] = useState(() => crypto.randomUUID());
  const [roomId, setRoomId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);
  const [decades, setDecades] = useState<Decade[]>([]);
  const posthog = usePostHog();

  const { room, players: playerRows } = useRoomRealtime(roomId);
  const players = playerRows.map(playerRowToPlayer);
  const currentQuestion = useCurrentQuestion(room);
  const blockCandidates = useBlockCandidates(room);

  // Create a fresh room the moment the TV boots up.
  useEffect(() => {
    let cancelled = false;
    createRoom(hostId).then((newRoom) => {
      if (!cancelled) {
        setRoomId(newRoom.id);
        posthog?.capture("room_created", { room_code: newRoom.code });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hostId, posthog]);

  // The lobby's decade filter is data-driven — fetched once, not
  // hardcoded — so a new decade becomes a data change, not a code deploy.
  useEffect(() => {
    let cancelled = false;
    fetchDecades().then((rows) => {
      if (!cancelled) setDecades(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    const step = nextPassiveStep(room.status, room.question_index);
    if (!step) return;
    if (
      (step.status === "question" || step.status === "countdown") &&
      step.questionIndex !== undefined &&
      room.question_ids
    ) {
      updateRoom(room.id, {
        status: step.status,
        question_index: step.questionIndex,
        current_question_id: room.question_ids[step.questionIndex],
      });
    } else {
      if (step.status === "end") {
        posthog?.capture("game_ended", { room_code: room.code, player_count: players.length });
      }
      updateRoom(room.id, { status: step.status });
    }
  }, [room, players.length, posthog]);

  // Picks the whole game's question set at once — 15 main questions (3
  // rounds of 5) plus the 3 block candidates — all respecting the room's
  // decade filter, and all guaranteed distinct from one another.
  async function handleStartGame() {
    if (!room) return;
    const picks = await fetchRandomQuestionSet(room.decade_filter, TOTAL_MAIN_QUESTIONS + 3);
    const questionIds = picks.slice(0, TOTAL_MAIN_QUESTIONS).map((q) => q.id);
    const blockCandidateIds = picks.slice(TOTAL_MAIN_QUESTIONS).map((q) => q.id);
    await updateRoom(room.id, {
      status: "countdown",
      question_index: 0,
      question_ids: questionIds,
      current_question_id: questionIds[0],
      block_candidate_ids: blockCandidateIds,
    });
    posthog?.capture("game_started", {
      room_code: room.code,
      decade_filter: room.decade_filter,
      player_count: players.length,
    });
  }

  // Round-start countdown auto-advances once it hits 0 — nobody presses a
  // button for this one, unlike the other passive stages. Guarded on
  // status so a stale timer (e.g. left running from a prior countdown)
  // can't fire a redundant status write.
  const handleCountdownDone = useCallback(() => {
    if (!room || room.status !== "countdown") return;
    updateRoom(room.id, { status: "question" });
  }, [room]);

  const countdownSecondsRemaining = useCountdown(
    ROUND_START_COUNTDOWN_SECONDS,
    `${room?.id ?? "none"}-${room?.status ?? "none"}-${room?.question_index ?? "none"}`,
    handleCountdownDone,
  );

  useEffect(() => {
    if (!room || !PASSIVE_STATUSES.includes(room.status)) return;

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
    if (!room?.current_question_id || !currentQuestion) return;
    const question = currentQuestion;

    const relevantAnswers = answers.filter((a) => a.question_id === room.current_question_id);
    const participants =
      room.status === "soloQuestion" ? players.filter((p) => p.id === room.blocker_player_id) : players;

    const results: PlayerPointResult[] = participants.map((p) => {
      const answer = relevantAnswers.find((a) => a.player_id === p.id);
      if (!answer) return { playerId: p.id, pointsGained: 0, correct: false, answeredIndex: null };
      const correct = answer.answer === question.correctIndex;
      return {
        playerId: p.id,
        pointsGained: computeScore(correct, answer.response_time_ms, question.timeLimitSeconds, question.pointsMultiplier),
        correct,
        answeredIndex: answer.answer,
      };
    });

    const nextRoundLabel = labelForStep(nextPassiveStep(nextStatus, room.question_index));
    setLastRoundResult({ question, results, nextRoundLabel });
    await updateRoom(room.id, { status: nextStatus });
  }

  if (!room) return <LoadingState message="Creating room…" />;

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
          onSelectDecade={(id) => {
            setDecadeFilter(room.id, id);
            posthog?.capture("decade_selected", { decade: id });
          }}
          onStartGame={handleStartGame}
          decades={[...decades, ALL_DECADES_OPTION]}
        />
      )}

      {room.status === "countdown" && currentQuestion && (
        <RoundStartScreen roundLabel={currentQuestion.roundLabel} secondsRemaining={countdownSecondsRemaining} />
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

      {room.status === "block" &&
        (blockCandidates.length > 0 ? (
          <BlockScreen players={players} candidates={blockCandidates} />
        ) : (
          <LoadingState message="Picking questions…" />
        ))}

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

      {room.status === "end" && <EndGameScreen players={players} onPlayAgain={handlePlayAgain} />}

      {PASSIVE_STATUSES.includes(room.status) && <PassiveAdvanceHint />}
    </>
  );
}
