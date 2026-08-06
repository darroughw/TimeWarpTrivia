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
}

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

// A candidate final-round question the lowest-scoring player can veto
// ("block") before it's played. Only a preview is shown at choice time —
// the full question text stays hidden until it's actually asked.
export interface BlockCandidate {
  id: string;
  decadeId: DecadeId;
  preview: string;
}

export interface FinalStanding {
  playerName: string;
  rank: number;
  totalPlayers: number;
  score: number;
  winnerName: string;
  winnerScore: number;
}
