export type DecadeId = "60s" | "70s" | "80s" | "90s" | "2000s" | "2010s" | "all";

export interface Decade {
  id: DecadeId;
  label: string;
}

// Deep Cuts topics (TIM-41) — structurally parallel to Decade, but a
// plain string id rather than a closed union, since new topics are
// meant to be added over time with zero code changes.
export interface DeepCutTopic {
  id: string;
  label: string;
}

export interface Player {
  id: string;
  name: string;
  emoji: string;
  color: string;
  score: number;
  // "left" means removed by the host (TIM-35) — excluded from block-picker
  // selection and lobby/start-game counts, but their score stays on the
  // board rather than being erased from history.
  status: "active" | "left";
}

export interface Question {
  id: string;
  roundLabel: string;
  // null for Deep Cuts questions (TIM-41) — they belong to a topic, not
  // a decade.
  decadeId: DecadeId | null;
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

// How long the "Round 2 in 5…" countdown holds before a round's first
// question appears. Only the TV writes the status transition that ends
// it, but the phone renders its own local countdown off this same
// number so the two displays read as in sync.
export const ROUND_START_COUNTDOWN_SECONDS = 5;

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
