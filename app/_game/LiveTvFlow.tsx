"use client";

import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";
import BlockScreen from "@/components/tv/BlockScreen";
import DeepCutsLobbyScreen from "@/components/tv/DeepCutsLobbyScreen";
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
import { useDecadeTheme } from "@/hooks/useDecadeTheme";
import { useRoomAnswers } from "@/hooks/useRoomAnswers";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { playerRowToPlayer } from "@/lib/avatar";
import type { RoomStatus } from "@/lib/database.types";
import { ALL_DECADES_OPTION } from "@/lib/decadeColors";
import { fetchDecades, fetchDeepCutTopics, fetchRandomQuestionSet } from "@/lib/questionService";
import {
  createRoom,
  updateRoom,
  setDecadeFilter,
  setDeepCutTopic,
  removePlayer,
  resetActivePlayerScores,
  clearRoomAnswers,
} from "@/lib/roomService";
import { computeScore } from "@/lib/scoring";
import {
  ROUND_START_COUNTDOWN_SECONDS,
  type Decade,
  type DeepCutTopic,
  type PlayerPointResult,
  type RoundResult,
} from "@/lib/types";

// 3 rounds of 5 questions each, in question_ids: round 1 = [0,5), round
// 2 = [5,10), round 3 (final, double points) = [10,15). Which round is
// "live" is always derived from question_index — see
// lib/questionService.questionMetaForRoom, the single source of truth
// this mirrors.
export const QUESTIONS_PER_ROUND = 5;
export const TOTAL_MAIN_QUESTIONS = QUESTIONS_PER_ROUND * 3;

export interface PassiveStep {
  status: RoomStatus;
  questionIndex?: number;
}

// What comes next from a "passive" stage — one the host advances manually
// with Enter/→ — given the room's current status and question_index.
// Unlike the old flat status->status map, "what's next" now depends on
// *where in the question sequence* the room is, not just its status.
export function nextPassiveStep(fromStatus: RoomStatus, questionIndex: number | null): PassiveStep | null {
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

export function labelForStep(step: PassiveStep | null): string {
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

interface LiveTvFlowProps {
  // Which lobby UI + content source this TV session uses (TIM-41). Not
  // persisted to the DB — a TV tab creates exactly one room on mount and
  // never changes mode within its own lifetime, so a runtime prop is
  // enough; see rooms.deep_cut_topic_id for the only thing that is
  // persisted.
  mode?: "decade" | "deepCuts";
}

export default function LiveTvFlow({ mode = "decade" }: LiveTvFlowProps) {
  const [hostId] = useState(() => crypto.randomUUID());
  const [roomId, setRoomId] = useState<string | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);
  const [decades, setDecades] = useState<Decade[]>([]);
  const [deepCutTopics, setDeepCutTopics] = useState<DeepCutTopic[]>([]);
  const posthog = usePostHog();

  const { room, players: playerRows } = useRoomRealtime(roomId);
  const players = playerRows.map(playerRowToPlayer);
  const currentQuestion = useCurrentQuestion(room);
  const blockCandidates = useBlockCandidates(room);
  const { answers, clearAnswers } = useRoomAnswers(roomId);
  useDecadeTheme(room?.decade_filter);

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
    if (mode !== "decade") return;
    let cancelled = false;
    fetchDecades().then((rows) => {
      if (!cancelled) setDecades(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Same idea for Deep Cuts topics (TIM-41) — only fetched in that mode.
  useEffect(() => {
    if (mode !== "deepCuts") return;
    let cancelled = false;
    fetchDeepCutTopics().then((rows) => {
      if (!cancelled) setDeepCutTopics(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

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
  // content source (decade filter or Deep Cuts topic, TIM-41), and all
  // guaranteed distinct from one another.
  async function handleStartGame() {
    if (!room) return;
    const source =
      mode === "deepCuts" && room.deep_cut_topic_id
        ? { deepCutTopicId: room.deep_cut_topic_id }
        : { decadeFilter: room.decade_filter };
    const picks = await fetchRandomQuestionSet(source, TOTAL_MAIN_QUESTIONS + 3, room.asked_question_ids);
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
      deep_cut_topic_id: room.deep_cut_topic_id,
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

  // Same-room rematch (TIM-38): keep the code, reset only still-active
  // players' scores, clear answer history, and send the room back to
  // "lobby" — the same status LobbyScreen already renders for a brand
  // new room, so a rematch needs no special-cased UI. Every question
  // this game touched (main + block candidates) gets folded into
  // asked_question_ids so the next Start Game steers away from repeats.
  async function handlePlayAgain() {
    if (!room) return;
    setLastRoundResult(null);
    clearAnswers();
    const askedThisGame = [...(room.question_ids ?? []), ...(room.block_candidate_ids ?? [])];
    const askedSoFar = Array.from(new Set([...room.asked_question_ids, ...askedThisGame]));
    await Promise.all([resetActivePlayerScores(room.id), clearRoomAnswers(room.id)]);
    await updateRoom(room.id, {
      status: "lobby",
      ...(mode === "deepCuts" ? { deep_cut_topic_id: null } : { decade_filter: "all" as const }),
      current_question_id: null,
      blocker_player_id: null,
      question_ids: null,
      question_index: null,
      block_candidate_ids: null,
      asked_question_ids: askedSoFar,
    });
    posthog?.capture("play_again", { room_code: room.code });
  }

  // Ends this room for good and hands the TV to a brand-new room/code —
  // the old room is left exactly as it is (still "end", never deleted),
  // matching the "persists until cancelled" call on TIM-38. This is what
  // "Play Again" used to (incorrectly) do before the rematch above
  // replaced it.
  async function handleCancelGame() {
    if (!room) return;
    setLastRoundResult(null);
    posthog?.capture("game_cancelled", { room_code: room.code });
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
      room.status === "soloQuestion"
        ? players.filter((p) => p.id === room.blocker_player_id)
        : players.filter((p) => p.status === "active");

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
  // A removed player will never submit an answer — counting them toward
  // the "X of Y answered" total would mean a question can never finish
  // early once someone's gone, only ever time out (TIM-34).
  const activePlayerCount = players.filter((p) => p.status === "active").length;

  function handleRemovePlayer(playerId: string) {
    removePlayer(playerId);
    posthog?.capture("player_removed", { room_code: room?.code });
  }

  return (
    <>
      {room.status === "lobby" &&
        (mode === "deepCuts" ? (
          <DeepCutsLobbyScreen
            roomCode={room.code}
            players={players}
            selectedTopicId={room.deep_cut_topic_id}
            onSelectTopic={(id) => {
              setDeepCutTopic(room.id, id);
              posthog?.capture("deep_cut_topic_selected", { topic: id });
            }}
            onStartGame={handleStartGame}
            topics={deepCutTopics}
            onRemovePlayer={handleRemovePlayer}
          />
        ) : (
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
            onRemovePlayer={handleRemovePlayer}
          />
        ))}

      {room.status === "countdown" && currentQuestion && (
        <RoundStartScreen roundLabel={currentQuestion.roundLabel} secondsRemaining={countdownSecondsRemaining} />
      )}

      {room.status === "question" && currentQuestion && (
        <QuestionScreen
          question={currentQuestion}
          totalPlayers={activePlayerCount}
          answeredCount={answeredCount}
          onTimeUp={() => handleQuestionTimeUp("transition")}
        />
      )}

      {room.status === "transition" && lastRoundResult && (
        <RoundTransitionScreen result={lastRoundResult} players={players} />
      )}

      {room.status === "scoreboard" && (
        <ScoreboardScreen
          players={players}
          roundLabel={currentQuestion?.roundLabel ?? ""}
          onRemovePlayer={handleRemovePlayer}
        />
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

      {room.status === "end" && (
        <EndGameScreen players={players} onPlayAgain={handlePlayAgain} onCancelGame={handleCancelGame} />
      )}

      {PASSIVE_STATUSES.includes(room.status) && <PassiveAdvanceHint />}
    </>
  );
}
