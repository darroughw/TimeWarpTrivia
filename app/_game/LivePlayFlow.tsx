"use client";

import { useEffect, useRef, useState } from "react";
import AnsweredScreen from "@/components/phone/AnsweredScreen";
import BlockChoiceScreen from "@/components/phone/BlockChoiceScreen";
import BlockedSpectatorScreen from "@/components/phone/BlockedSpectatorScreen";
import FinalResultsScreen from "@/components/phone/FinalResultsScreen";
import JoinScreen from "@/components/phone/JoinScreen";
import QuestionScreen from "@/components/phone/QuestionScreen";
import WaitingScreen from "@/components/phone/WaitingScreen";
import { useBlockCandidates } from "@/hooks/useBlockCandidates";
import { useCurrentQuestion } from "@/hooks/useCurrentQuestion";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { getAvatarForName, playerRowToPlayer } from "@/lib/avatar";
import { rankedByScore } from "@/lib/mockData";
import { fetchRoomByCode, joinRoom, submitAnswer, updateRoom } from "@/lib/roomService";
import { computeScore } from "@/lib/scoring";
import { OPTION_LETTERS, type FinalStanding } from "@/lib/types";

export default function LivePlayFlow() {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | undefined>(undefined);
  const [joining, setJoining] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [lastPickedLetter, setLastPickedLetter] = useState<string>("A");

  // Not state — these just need to persist across renders without
  // triggering any of their own, so a question's response time is
  // measured from when it actually appeared, not from a render tick.
  const questionShownAtRef = useRef<number | null>(null);
  const trackedQuestionIdRef = useRef<string | null>(null);

  const { room, players: playerRows } = useRoomRealtime(roomId);
  const players = playerRows.map(playerRowToPlayer);
  const player = players.find((p) => p.id === playerId);
  const currentQuestion = useCurrentQuestion(room);
  const blockCandidates = useBlockCandidates(room);

  useEffect(() => {
    if (!room?.current_question_id) return;
    if (trackedQuestionIdRef.current !== room.current_question_id) {
      trackedQuestionIdRef.current = room.current_question_id;
      questionShownAtRef.current = Date.now();
    }
  }, [room?.current_question_id]);

  async function handleJoin(name: string, code: string) {
    setJoining(true);
    setJoinError(undefined);
    try {
      const foundRoom = await fetchRoomByCode(code);
      if (!foundRoom) {
        setJoinError("Room not found — check the code and try again.");
        return;
      }
      const { emoji } = getAvatarForName(name);
      const newPlayer = await joinRoom(foundRoom.id, name, emoji);
      setPlayerName(name);
      setPlayerId(newPlayer.id);
      setRoomId(foundRoom.id);
    } catch {
      setJoinError("Something went wrong joining — try again.");
    } finally {
      setJoining(false);
    }
  }

  async function handleAnswer(index: number) {
    if (!room?.current_question_id || !playerId || !currentQuestion) return;
    const question = currentQuestion;

    const responseTimeMs = questionShownAtRef.current ? Date.now() - questionShownAtRef.current : 0;
    const correct = index === question.correctIndex;
    const pointsGained = computeScore(correct, responseTimeMs, question.timeLimitSeconds, question.pointsMultiplier);

    setLastPickedLetter(OPTION_LETTERS[index]);
    setAnsweredQuestionIds((current) => new Set(current).add(question.id));

    await submitAnswer({
      roomId: room.id,
      playerId,
      questionId: question.id,
      answerIndex: index,
      responseTimeMs,
      pointsGained,
    });
  }

  async function handleBlockChoice(questionId: string) {
    if (!room || !playerId) return;
    await updateRoom(room.id, {
      status: "soloQuestion",
      current_question_id: questionId,
      blocker_player_id: playerId,
    });
  }

  function handlePlayAgain() {
    setRoomId(null);
    setPlayerId(null);
    setPlayerName("");
    setAnsweredQuestionIds(new Set());
    trackedQuestionIdRef.current = null;
    questionShownAtRef.current = null;
  }

  if (!roomId || !room) {
    return <JoinScreen onJoin={handleJoin} error={joinError} submitting={joining} />;
  }

  if (room.status === "lobby") {
    return <WaitingScreen playerName={playerName} roomCode={room.code} />;
  }

  const isSoloStage = room.status === "soloQuestion";
  const isBlocker = playerId === room.blocker_player_id;
  const alreadyAnswered = currentQuestion ? answeredQuestionIds.has(currentQuestion.id) : false;

  if ((room.status === "question" || isSoloStage) && currentQuestion) {
    if (isSoloStage && !isBlocker) {
      return <BlockedSpectatorScreen question={currentQuestion} />;
    }
    if (alreadyAnswered) {
      return <AnsweredScreen pickedLetter={lastPickedLetter} />;
    }
    return <QuestionScreen question={currentQuestion} onAnswer={handleAnswer} />;
  }

  if (room.status === "block") {
    const lowestScorer = rankedByScore(players)[players.length - 1];
    if (player && lowestScorer?.id === player.id) {
      if (blockCandidates.length === 0) {
        return <WaitingScreen playerName={playerName} roomCode={room.code} message="Loading your questions…" />;
      }
      return <BlockChoiceScreen candidates={blockCandidates} onConfirm={handleBlockChoice} />;
    }
    return (
      <WaitingScreen
        playerName={playerName}
        roomCode={room.code}
        message="Waiting for the last-place player to choose a question…"
      />
    );
  }

  if (room.status === "transition" || room.status === "soloTransition" || room.status === "scoreboard") {
    return <WaitingScreen playerName={playerName} roomCode={room.code} message="Check the TV screen!" />;
  }

  if (room.status === "end") {
    const ranked = rankedByScore(players);
    const rank = ranked.findIndex((p) => p.id === playerId) + 1;
    const winner = ranked[0];
    const standing: FinalStanding = {
      playerName,
      rank: rank || ranked.length,
      totalPlayers: players.length,
      score: player?.score ?? 0,
      winnerName: winner?.name ?? "",
      winnerScore: winner?.score ?? 0,
    };
    return <FinalResultsScreen standing={standing} onPlayAgain={handlePlayAgain} />;
  }

  return <WaitingScreen playerName={playerName} roomCode={room.code} message="One sec…" />;
}
