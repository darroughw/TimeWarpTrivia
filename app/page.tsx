"use client";

import { useCallback, useEffect, useState } from "react";
import BlockScreen from "@/components/tv/BlockScreen";
import EndGameScreen from "@/components/tv/EndGameScreen";
import LobbyScreen from "@/components/tv/LobbyScreen";
import QuestionScreen from "@/components/tv/QuestionScreen";
import RoundTransitionScreen from "@/components/tv/RoundTransitionScreen";
import ScoreboardScreen from "@/components/tv/ScoreboardScreen";
import {
  MOCK_FINAL_QUESTION,
  MOCK_FINAL_ROUND_RESULT,
  MOCK_PLAYERS,
  MOCK_QUESTION,
  MOCK_ROUND_RESULT,
} from "@/lib/mockData";
import type { Player, RoundResult } from "@/lib/types";
import styles from "./page.module.scss";

// The stages a round of TimeWarp Trivia moves through on the TV. Screens
// with their own controls (lobby, block, end) advance themselves; the
// passive reveal screens (transition, scoreboard) advance on ArrowRight/Enter
// so a producer can pace the broadcast with a remote.
type Stage = "lobby" | "question" | "transition" | "scoreboard" | "block" | "finalQuestion" | "finalTransition" | "end";

const PASSIVE_ADVANCE: Partial<Record<Stage, Stage>> = {
  transition: "scoreboard",
  scoreboard: "block",
  finalTransition: "end",
};

function applyRoundResult(players: Player[], result: RoundResult): Player[] {
  const gainByPlayerId = new Map(result.results.map((r) => [r.playerId, r.pointsGained]));
  return players.map((player) => ({
    ...player,
    score: player.score + (gainByPlayerId.get(player.id) ?? 0),
  }));
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("lobby");
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);

  const handleAdvance = useCallback(() => {
    setStage((current) => PASSIVE_ADVANCE[current] ?? current);
  }, []);

  useEffect(() => {
    if (!PASSIVE_ADVANCE[stage]) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleAdvance();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stage, handleAdvance]);

  function handlePlayAgain() {
    setPlayers(MOCK_PLAYERS);
    setStage("lobby");
  }

  return (
    <>
      {stage === "lobby" && <LobbyScreen onStartGame={() => setStage("question")} />}

      {stage === "question" && (
        <QuestionScreen
          question={MOCK_QUESTION}
          totalPlayers={players.length}
          onTimeUp={() => {
            setPlayers((current) => applyRoundResult(current, MOCK_ROUND_RESULT));
            setStage("transition");
          }}
        />
      )}

      {stage === "transition" && <RoundTransitionScreen result={MOCK_ROUND_RESULT} />}

      {stage === "scoreboard" && <ScoreboardScreen players={players} roundLabel={MOCK_QUESTION.roundLabel} />}

      {stage === "block" && (
        <BlockScreen players={players} onConfirm={() => setStage("finalQuestion")} />
      )}

      {stage === "finalQuestion" && (
        <QuestionScreen
          question={MOCK_FINAL_QUESTION}
          totalPlayers={players.length}
          onTimeUp={() => {
            setPlayers((current) => applyRoundResult(current, MOCK_FINAL_ROUND_RESULT));
            setStage("finalTransition");
          }}
        />
      )}

      {stage === "finalTransition" && <RoundTransitionScreen result={MOCK_FINAL_ROUND_RESULT} />}

      {stage === "end" && <EndGameScreen players={players} onPlayAgain={handlePlayAgain} />}

      {PASSIVE_ADVANCE[stage] && (
        <div className={styles.hint}>
          Press <span className={styles.hintKey}>&rarr;</span> or{" "}
          <span className={styles.hintKey}>Enter</span> to continue
        </div>
      )}
    </>
  );
}
