"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BlockScreen from "@/components/tv/BlockScreen";
import EndGameScreen from "@/components/tv/EndGameScreen";
import LobbyScreen from "@/components/tv/LobbyScreen";
import PassiveAdvanceHint from "@/components/tv/PassiveAdvanceHint";
import QuestionScreen from "@/components/tv/QuestionScreen";
import RoundStartScreen from "@/components/tv/RoundStartScreen";
import RoundTransitionScreen from "@/components/tv/RoundTransitionScreen";
import ScoreboardScreen from "@/components/tv/ScoreboardScreen";
import SimulatorBadge from "@/components/tv/SimulatorBadge";
import LoadingState from "@/components/shared/LoadingState";
import { useBlockCandidates } from "@/hooks/useBlockCandidates";
import { useCountdown } from "@/hooks/useCountdown";
import { useCurrentQuestion } from "@/hooks/useCurrentQuestion";
import { useDecadeTheme } from "@/hooks/useDecadeTheme";
import { useRoomAnswers } from "@/hooks/useRoomAnswers";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { getAvatarForName, playerRowToPlayer } from "@/lib/avatar";
import type { RoomStatus } from "@/lib/database.types";
import { ALL_DECADES_OPTION } from "@/lib/decadeColors";
import { pickBlockChooser, pickRandomContestantNames } from "@/lib/mockData";
import { fetchDecades, fetchRandomQuestionSet } from "@/lib/questionService";
import {
  clearRoomAnswers,
  createRoom,
  joinRoom,
  resetActivePlayerScores,
  setDecadeFilter,
  submitAnswer,
  updateRoom,
} from "@/lib/roomService";
import { computeScore } from "@/lib/scoring";
import { ROUND_START_COUNTDOWN_SECONDS, type Decade, type PlayerPointResult, type RoundResult } from "@/lib/types";
import { labelForStep, nextPassiveStep, TOTAL_MAIN_QUESTIONS } from "./LiveTvFlow";

// Portfolio-demo mode, unlocked by the Konami code on /host (see
// hooks/useKonamiCode). Reuses the exact same primitives as LiveTvFlow —
// room service, question service, realtime hooks, and every screen
// component — but every stage advances on a host keypress instead of a
// timer, and the room fills with fake contestants instead of waiting for
// real phones. A real phone can still join the generated code over /play
// and play alongside them; see the plan doc for why this lives in its own
// component rather than a flag on LiveTvFlow (the production game engine
// shouldn't carry demo-only branches).
const FAKE_PLAYER_COUNT = 5;
const FAKE_JOIN_INTERVAL_MS = 900;
const FAKE_CORRECT_PROBABILITY = 0.7;

const MANUAL_STATUSES: RoomStatus[] = ["transition", "scoreboard", "soloTransition", "question", "soloQuestion", "block"];

export default function SimulatorTvFlow() {
  const [hostId] = useState(() => crypto.randomUUID());
  const [roomId, setRoomId] = useState<string | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);
  const [decades, setDecades] = useState<Decade[]>([]);
  const [fakePlayerIds, setFakePlayerIds] = useState<Set<string>>(new Set());

  const { room, players: playerRows } = useRoomRealtime(roomId);
  const players = playerRows.map(playerRowToPlayer);
  const currentQuestion = useCurrentQuestion(room);
  const blockCandidates = useBlockCandidates(room);
  const { answers, clearAnswers } = useRoomAnswers(roomId);
  useDecadeTheme(room?.decade_filter);

  // Create a fresh demo room the moment the simulator mounts.
  useEffect(() => {
    let cancelled = false;
    createRoom(hostId).then((newRoom) => {
      if (!cancelled) setRoomId(newRoom.id);
    });
    return () => {
      cancelled = true;
    };
  }, [hostId]);

  useEffect(() => {
    let cancelled = false;
    fetchDecades().then((rows) => {
      if (!cancelled) setDecades(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Stagger fake contestants into the lobby exactly once per room — a
  // rematch (Play Again) reuses the same room/players and just resets
  // scores, so this only needs to fire on a room's first visit to lobby.
  const joinedForRoomRef = useRef<string | null>(null);
  useEffect(() => {
    if (!room || room.status !== "lobby" || joinedForRoomRef.current === room.id) return;
    joinedForRoomRef.current = room.id;
    let cancelled = false;

    pickRandomContestantNames(FAKE_PLAYER_COUNT).forEach((name, index) => {
      window.setTimeout(async () => {
        if (cancelled) return;
        const { emoji } = getAvatarForName(name);
        const player = await joinRoom(room.id, name, emoji);
        if (cancelled) return;
        setFakePlayerIds((current) => new Set(current).add(player.id));
      }, FAKE_JOIN_INTERVAL_MS * (index + 1));
    });

    return () => {
      cancelled = true;
    };
  }, [room]);

  async function handleStartGame() {
    if (!room) return;
    const picks = await fetchRandomQuestionSet({ decadeFilter: room.decade_filter }, TOTAL_MAIN_QUESTIONS + 3, room.asked_question_ids);
    const questionIds = picks.slice(0, TOTAL_MAIN_QUESTIONS).map((q) => q.id);
    const blockCandidateIds = picks.slice(TOTAL_MAIN_QUESTIONS).map((q) => q.id);
    await updateRoom(room.id, {
      status: "countdown",
      question_index: 0,
      question_ids: questionIds,
      current_question_id: questionIds[0],
      block_candidate_ids: blockCandidateIds,
    });
  }

  const handleCountdownDone = useCallback(() => {
    if (!room || room.status !== "countdown") return;
    updateRoom(room.id, { status: "question" });
  }, [room]);

  const countdownSecondsRemaining = useCountdown(
    ROUND_START_COUNTDOWN_SECONDS,
    `${room?.id ?? "none"}-${room?.status ?? "none"}-${room?.question_index ?? "none"}`,
    handleCountdownDone,
  );

  // transition / scoreboard / soloTransition — same round-index arithmetic
  // as the real game (imported, not reimplemented), just triggered by a
  // keypress here the same way it's triggered by a keypress on /host too.
  function handlePassiveAdvance() {
    if (!room) return;
    const step = nextPassiveStep(room.status, room.question_index);
    if (!step) return;
    if ((step.status === "question" || step.status === "countdown") && step.questionIndex !== undefined && room.question_ids) {
      updateRoom(room.id, {
        status: step.status,
        question_index: step.questionIndex,
        current_question_id: room.question_ids[step.questionIndex],
      });
    } else {
      updateRoom(room.id, { status: step.status });
    }
  }

  // question / soloQuestion — the manual-advance replacement for
  // LiveTvFlow's timer-driven onTimeUp. Any fake contestant who hasn't
  // answered yet gets a plausible answer generated now; a real player's
  // own answer (if they've already tapped one on /play) is left as-is.
  // Results are built from data already in hand rather than re-reading
  // `answers` after submitAnswer, since that would race the realtime
  // round-trip that normally has 15-20s of real gameplay to land in.
  async function handleAdvanceQuestion() {
    if (!room?.current_question_id || !currentQuestion) return;
    const question = currentQuestion;
    const nextStatus: RoomStatus = room.status === "soloQuestion" ? "soloTransition" : "transition";
    const participants =
      room.status === "soloQuestion"
        ? players.filter((p) => p.id === room.blocker_player_id)
        : players.filter((p) => p.status === "active");

    const results: PlayerPointResult[] = [];
    for (const participant of participants) {
      const existing = answers.find((a) => a.question_id === room.current_question_id && a.player_id === participant.id);

      if (existing) {
        const correct = existing.answer === question.correctIndex;
        results.push({
          playerId: participant.id,
          pointsGained: computeScore(correct, existing.response_time_ms, question.timeLimitSeconds, question.pointsMultiplier),
          correct,
          answeredIndex: existing.answer,
        });
        continue;
      }

      if (!fakePlayerIds.has(participant.id)) {
        // A real player who hasn't answered yet — same as a real timeout.
        results.push({ playerId: participant.id, pointsGained: 0, correct: false, answeredIndex: null });
        continue;
      }

      const correct = Math.random() < FAKE_CORRECT_PROBABILITY;
      const wrongOptions = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
      const answerIndex = correct ? question.correctIndex : wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      const responseTimeMs = Math.round((0.2 + Math.random() * 0.7) * question.timeLimitSeconds * 1000);
      const pointsGained = computeScore(correct, responseTimeMs, question.timeLimitSeconds, question.pointsMultiplier);

      await submitAnswer({
        roomId: room.id,
        playerId: participant.id,
        questionId: question.id,
        answerIndex,
        responseTimeMs,
        pointsGained,
      });
      results.push({ playerId: participant.id, pointsGained, correct, answeredIndex: answerIndex });
    }

    const nextRoundLabel = labelForStep(nextPassiveStep(nextStatus, room.question_index));
    setLastRoundResult({ question, results, nextRoundLabel });
    await updateRoom(room.id, { status: nextStatus });
  }

  // block — only resolved here if the lowest scorer is a fake contestant.
  // A real player who lands in last place picks on their own phone, same
  // as production; this is a no-op until they do.
  async function handleAdvanceBlock() {
    if (!room || blockCandidates.length === 0) return;
    const blocker = pickBlockChooser(players);
    if (!blocker || !fakePlayerIds.has(blocker.id)) return;
    const candidate = blockCandidates[Math.floor(Math.random() * blockCandidates.length)];
    await updateRoom(room.id, { status: "soloQuestion", current_question_id: candidate.id, blocker_player_id: blocker.id });
  }

  useEffect(() => {
    if (!room || !MANUAL_STATUSES.includes(room.status)) return;

    function onKeyDown(event: KeyboardEvent) {
      if (!room) return;
      if (event.key !== "ArrowRight" && event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (room.status === "question" || room.status === "soloQuestion") handleAdvanceQuestion();
      else if (room.status === "block") handleAdvanceBlock();
      else handlePassiveAdvance();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, players, answers, fakePlayerIds, blockCandidates, currentQuestion]);

  async function handlePlayAgain() {
    if (!room) return;
    setLastRoundResult(null);
    clearAnswers();
    const askedThisGame = [...(room.question_ids ?? []), ...(room.block_candidate_ids ?? [])];
    const askedSoFar = Array.from(new Set([...room.asked_question_ids, ...askedThisGame]));
    await Promise.all([resetActivePlayerScores(room.id), clearRoomAnswers(room.id)]);
    await updateRoom(room.id, {
      status: "lobby",
      decade_filter: "all",
      current_question_id: null,
      blocker_player_id: null,
      question_ids: null,
      question_index: null,
      block_candidate_ids: null,
      asked_question_ids: askedSoFar,
    });
  }

  async function handleCancelGame() {
    if (!room) return;
    setLastRoundResult(null);
    const newRoom = await createRoom(hostId);
    setRoomId(newRoom.id);
  }

  if (!room) return <LoadingState message="Spinning up a demo room…" />;

  const answeredCount = currentQuestion ? answers.filter((a) => a.question_id === room.current_question_id).length : 0;
  const soloPlayer = players.find((p) => p.id === room.blocker_player_id);
  const activePlayerCount = players.filter((p) => p.status === "active").length;

  return (
    <>
      <SimulatorBadge />

      {room.status === "lobby" && (
        <LobbyScreen
          roomCode={room.code}
          players={players}
          selectedDecade={room.decade_filter}
          onSelectDecade={(id) => setDecadeFilter(room.id, id)}
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
          totalPlayers={activePlayerCount}
          answeredCount={answeredCount}
          onTimeUp={handleAdvanceQuestion}
          manualAdvance
        />
      )}

      {room.status === "transition" && lastRoundResult && <RoundTransitionScreen result={lastRoundResult} players={players} />}

      {room.status === "scoreboard" && <ScoreboardScreen players={players} roundLabel={currentQuestion?.roundLabel ?? ""} />}

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
          onTimeUp={handleAdvanceQuestion}
          manualAdvance
        />
      )}

      {room.status === "soloTransition" && lastRoundResult && <RoundTransitionScreen result={lastRoundResult} players={players} />}

      {room.status === "end" && <EndGameScreen players={players} onPlayAgain={handlePlayAgain} onCancelGame={handleCancelGame} />}

      {["transition", "scoreboard", "soloTransition"].includes(room.status) && <PassiveAdvanceHint />}
    </>
  );
}
