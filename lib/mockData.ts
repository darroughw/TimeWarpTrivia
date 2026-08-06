import type { BlockCandidate, Decade, FinalStanding, Player, Question, RoundResult } from "./types";

export const ROOM_CODE = "WARP-72";

export const DECADES: Decade[] = [
  { id: "80s", label: "80s" },
  { id: "90s", label: "90s" },
  { id: "2000s", label: "2000s" },
  { id: "2010s", label: "2010s" },
  { id: "all", label: "All Decades" },
];

// The full lobby roster. LobbyScreen reveals these one at a time to
// simulate players joining live.
export const MOCK_PLAYERS: Player[] = [
  { id: "p1", name: "Deja View", emoji: "👾", color: "#ff3fa4", score: 340 },
  { id: "p2", name: "Rad Wave", emoji: "🎸", color: "#7c5cff", score: 260 },
  { id: "p3", name: "Cassette Ghost", emoji: "👻", color: "#33d6ff", score: 410 },
  { id: "p4", name: "Y2Kayla", emoji: "💿", color: "#ff8a3d", score: 180 },
  { id: "p5", name: "Blorbo", emoji: "🦖", color: "#2dd4bf", score: 395 },
  { id: "p6", name: "Neon Dad", emoji: "🕺", color: "#ffb238", score: 120 },
];

export const MOCK_QUESTION: Question = {
  id: "q-90s-4",
  roundLabel: "Round 3",
  decadeId: "90s",
  text: "In 1997, what did you have to do to keep a Tamagotchi from “dying”?",
  options: [
    "Feed it, clean up after it, and put it to sleep on a schedule",
    "Plug it into a Game Boy once a day",
    "Keep it within 10 feet of its charging pod",
    "Say its name out loud every morning",
  ],
  correctIndex: 0,
  timeLimitSeconds: 20,
};

export const MOCK_ROUND_RESULT: RoundResult = {
  question: MOCK_QUESTION,
  nextRoundLabel: "Round 4 — 2000s",
  results: [
    { playerId: "p1", pointsGained: 120, correct: true, answeredIndex: 0 },
    { playerId: "p2", pointsGained: 0, correct: false, answeredIndex: 2 },
    { playerId: "p3", pointsGained: 150, correct: true, answeredIndex: 0 },
    { playerId: "p4", pointsGained: 0, correct: false, answeredIndex: 3 },
    { playerId: "p5", pointsGained: 95, correct: true, answeredIndex: 0 },
    { playerId: "p6", pointsGained: 0, correct: false, answeredIndex: 1 },
  ],
};

export const MOCK_FINAL_QUESTION: Question = {
  id: "q-2010s-final",
  roundLabel: "Final Round",
  decadeId: "2010s",
  text: "What was the first tweet-turned-meme to hit 1 million retweets, in 2017?",
  options: [
    "Carter Wilkerson's “HELP ME PLEASE. A MAN NEEDS HIS NUGGS” to Wendy's",
    "A NASA photo of Earth from Cassini",
    "The Oscars “Best Picture” envelope mix-up",
    "Ellen DeGeneres's Oscars selfie",
  ],
  correctIndex: 0,
  timeLimitSeconds: 15,
};

export const MOCK_FINAL_ROUND_RESULT: RoundResult = {
  question: MOCK_FINAL_QUESTION,
  nextRoundLabel: "Final Results",
  results: [
    { playerId: "p1", pointsGained: 0, correct: false, answeredIndex: 1 },
    { playerId: "p2", pointsGained: 0, correct: false, answeredIndex: 2 },
    { playerId: "p3", pointsGained: 180, correct: true, answeredIndex: 0 },
    { playerId: "p4", pointsGained: 0, correct: false, answeredIndex: 3 },
    { playerId: "p5", pointsGained: 220, correct: true, answeredIndex: 0 },
    { playerId: "p6", pointsGained: 0, correct: false, answeredIndex: 1 },
  ],
};

// Players ranked lowest-to-highest by score — the lowest scorer is the one
// choosing a block target before the final round.
export function rankedByScore(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.score - a.score);
}

// Candidate questions the lowest-scoring player can veto before the final
// round. Only a category preview is shown — not the real question text.
export const MOCK_BLOCK_CANDIDATES: BlockCandidate[] = [
  { id: "bq1", decadeId: "2010s", preview: "Viral memes & internet culture" },
  { id: "bq2", decadeId: "90s", preview: "90s Saturday morning cartoons" },
  { id: "bq3", decadeId: "2000s", preview: "Early 2000s reality TV" },
];

// The question that gets played out once blocked — everyone (including
// the player who blocked it) watches, nobody can answer it.
export const MOCK_BLOCKED_QUESTION: Question = {
  id: "q-2010s-blocked",
  roundLabel: "Final Round — Blocked",
  decadeId: "2010s",
  text: "Which app was the first to popularize the disappearing \"Story\" format, in 2013?",
  options: ["Snapchat", "Instagram", "Facebook", "BeReal"],
  correctIndex: 0,
  timeLimitSeconds: 15,
};

export const MOCK_FINAL_STANDING: FinalStanding = {
  playerName: "You",
  rank: 2,
  totalPlayers: 6,
  score: 740,
  winnerName: "Cassette Ghost",
  winnerScore: 760,
};
