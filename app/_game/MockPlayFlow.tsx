"use client";

import { useState } from "react";
import AnsweredScreen from "@/components/phone/AnsweredScreen";
import BlockChoiceScreen from "@/components/phone/BlockChoiceScreen";
import BlockedSpectatorScreen from "@/components/phone/BlockedSpectatorScreen";
import FinalResultsScreen from "@/components/phone/FinalResultsScreen";
import JoinScreen from "@/components/phone/JoinScreen";
import QuestionScreen from "@/components/phone/QuestionScreen";
import RevealScreen from "@/components/phone/RevealScreen";
import WaitingScreen from "@/components/phone/WaitingScreen";
import {
  MOCK_BLOCK_CANDIDATE_QUESTIONS,
  MOCK_FINAL_STANDING,
  MOCK_PICKED_BLOCK_QUESTION,
  MOCK_QUESTION,
} from "@/lib/mockData";
import { computeScore } from "@/lib/scoring";
import { playSound } from "@/lib/sounds";
import { OPTION_LETTERS } from "@/lib/types";

// The scripted, no-backend version of the phone flow — used when
// Supabase isn't configured. See LivePlayFlow for the real one.
type Stage = "join" | "waiting" | "question" | "answered" | "reveal" | "blockChoice" | "blockedSpectator" | "final";

export default function MockPlayFlow() {
  const [stage, setStage] = useState<Stage>("join");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>();
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);

  function handleJoin(name: string, code: string, pickedAvatar: string) {
    setPlayerName(name);
    setRoomCode(code);
    setAvatar(pickedAvatar);
    setStage("waiting");
  }

  function handlePlayAgain() {
    setPlayerName("");
    setRoomCode("");
    setAnsweredIndex(null);
    setStage("join");
  }

  return (
    <>
      {stage === "join" && <JoinScreen onJoin={handleJoin} />}

      {stage === "waiting" && (
        <WaitingScreen
          playerName={playerName}
          avatar={avatar}
          roomCode={roomCode}
          onHostStart={() => setStage("question")}
        />
      )}

      {stage === "question" && (
        <QuestionScreen
          question={MOCK_QUESTION}
          onAnswer={(index) => {
            setAnsweredIndex(index);
            playSound(index === MOCK_QUESTION.correctIndex ? "correct" : "wrong");
            setStage("answered");
          }}
        />
      )}

      {stage === "answered" && (
        <AnsweredScreen
          pickedLetter={OPTION_LETTERS[answeredIndex ?? 0]}
          onRoundEnd={() => setStage("reveal")}
        />
      )}

      {stage === "reveal" && (
        <RevealScreen
          outcome={answeredIndex === MOCK_QUESTION.correctIndex ? "correct" : "wrong"}
          question={MOCK_QUESTION}
          // A fixed, plausible response time — the mock flow doesn't track one.
          pointsGained={computeScore(
            answeredIndex === MOCK_QUESTION.correctIndex,
            4000,
            MOCK_QUESTION.timeLimitSeconds,
            MOCK_QUESTION.pointsMultiplier,
          )}
          streak={answeredIndex === MOCK_QUESTION.correctIndex ? 3 : 0}
          onDone={() => setStage("blockChoice")}
        />
      )}

      {stage === "blockChoice" && (
        <BlockChoiceScreen
          candidates={MOCK_BLOCK_CANDIDATE_QUESTIONS}
          onConfirm={() => setStage("blockedSpectator")}
        />
      )}

      {stage === "blockedSpectator" && (
        <BlockedSpectatorScreen
          question={MOCK_PICKED_BLOCK_QUESTION}
          onRoundEnd={() => setStage("final")}
        />
      )}

      {stage === "final" && (
        <FinalResultsScreen
          standing={{ ...MOCK_FINAL_STANDING, playerName: playerName || "You" }}
          onLeave={handlePlayAgain}
        />
      )}
    </>
  );
}
