"use client";

import { useState } from "react";
import AnsweredScreen from "@/components/phone/AnsweredScreen";
import BlockChoiceScreen from "@/components/phone/BlockChoiceScreen";
import BlockedSpectatorScreen from "@/components/phone/BlockedSpectatorScreen";
import FinalResultsScreen from "@/components/phone/FinalResultsScreen";
import JoinScreen from "@/components/phone/JoinScreen";
import QuestionScreen from "@/components/phone/QuestionScreen";
import WaitingScreen from "@/components/phone/WaitingScreen";
import {
  MOCK_BLOCK_CANDIDATES,
  MOCK_BLOCKED_QUESTION,
  MOCK_FINAL_STANDING,
  MOCK_QUESTION,
} from "@/lib/mockData";
import styles from "./page.module.scss";

type Stage = "join" | "waiting" | "question" | "answered" | "blockChoice" | "blockedSpectator" | "final";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export default function PlayPage() {
  const [stage, setStage] = useState<Stage>("join");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);

  function handleJoin(name: string, code: string) {
    setPlayerName(name);
    setRoomCode(code);
    setStage("waiting");
  }

  function handlePlayAgain() {
    setPlayerName("");
    setRoomCode("");
    setAnsweredIndex(null);
    setStage("join");
  }

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        {stage === "join" && <JoinScreen onJoin={handleJoin} />}

        {stage === "waiting" && (
          <WaitingScreen
            playerName={playerName}
            roomCode={roomCode}
            onHostStart={() => setStage("question")}
          />
        )}

        {stage === "question" && (
          <QuestionScreen
            question={MOCK_QUESTION}
            onAnswer={(index) => {
              setAnsweredIndex(index);
              setStage("answered");
            }}
          />
        )}

        {stage === "answered" && (
          <AnsweredScreen
            pickedLetter={OPTION_LETTERS[answeredIndex ?? 0]}
            onRoundEnd={() => setStage("blockChoice")}
          />
        )}

        {stage === "blockChoice" && (
          <BlockChoiceScreen
            candidates={MOCK_BLOCK_CANDIDATES}
            onConfirm={() => setStage("blockedSpectator")}
          />
        )}

        {stage === "blockedSpectator" && (
          <BlockedSpectatorScreen
            question={MOCK_BLOCKED_QUESTION}
            onRoundEnd={() => setStage("final")}
          />
        )}

        {stage === "final" && (
          <FinalResultsScreen
            standing={{ ...MOCK_FINAL_STANDING, playerName: playerName || "You" }}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    </div>
  );
}
