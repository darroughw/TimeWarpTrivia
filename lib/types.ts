export type DecadeId = "80s" | "90s" | "2000s" | "2010s" | "all";

export interface Decade {
  id: DecadeId;
  label: string;
}

export interface Player {
  id: string;
  name: string;
  emoji: string;
  color: string;
  score: number;
}

export interface Question {
  id: string;
  roundLabel: string;
  decadeId: DecadeId;
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  timeLimitSeconds: number;
  // 2 for the final round (Double Points), 1 everywhere else.
  pointsMultiplier: number;
}

// Answer-choice labels for Question.options, in order. Shared by every
// screen that renders a lettered option list (TV/phone question screens,
// the spectator view, the round-transition reveal).
export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export interface PlayerPointResult {
  playerId: string;
  pointsGained: number;
  correct: boolean;
  answeredIndex: number | null;
}

export interface RoundResult {
  question: Question;
  results: PlayerPointResult[];
  nextRoundLabel: string;
}

export interface FinalStanding {
  playerName: string;
  rank: number;
  totalPlayers: number;
  score: number;
  winnerName: string;
  winnerScore: number;
}
