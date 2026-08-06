import type { Decade, FinalStanding, Player, Question, RoundResult } from "./types";

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

// Players ranked highest-to-lowest by score (ranked[0] is the leader).
// The lowest scorer — ranked[ranked.length - 1] — is the one choosing a
// block target before the final round.
export function rankedByScore(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.score - a.score);
}

// Full candidate questions the lowest-scoring player chooses from — they
// read the real question text and pick the one they're most confident
// answering alone. Whichever one they pick is played solo: only they get
// answer controls, everyone else spectates, and only they can score on it.
export const MOCK_BLOCK_CANDIDATE_QUESTIONS: Question[] = [
  {
    id: "bq1",
    roundLabel: "Solo Round",
    decadeId: "80s",
    text: "Which 1985 film introduced the phrase \"Great Scott!\" into pop culture?",
    options: ["Back to the Future", "The Goonies", "Weird Science", "Ghostbusters"],
    correctIndex: 0,
    timeLimitSeconds: 15,
  },
  {
    id: "bq2",
    roundLabel: "Solo Round",
    decadeId: "90s",
    text: "What was the must-have holiday toy of 1996, notorious for nationwide shortages?",
    options: ["Tickle Me Elmo", "Furby", "Beanie Babies", "Polly Pocket"],
    correctIndex: 0,
    timeLimitSeconds: 15,
  },
  {
    id: "bq3",
    roundLabel: "Solo Round",
    decadeId: "2000s",
    text: "Which social network was the most-visited site in the U.S. before Facebook overtook it in 2008?",
    options: ["Myspace", "Friendster", "Bebo", "Xanga"],
    correctIndex: 0,
    timeLimitSeconds: 15,
  },
];

// The demo's stand-in for "the lowest scorer picked this one." In the real
// app this comes from the player's actual tap on /play; here it's fixed so
// both routes' scripted flows have something concrete to show.
export const MOCK_PICKED_BLOCK_QUESTION: Question = MOCK_BLOCK_CANDIDATE_QUESTIONS[1];

// Only the chooser (p6, the lowest scorer under MOCK_PLAYERS) appears in
// results — nobody else could answer this question, so nobody else scores.
export const MOCK_BLOCK_ROUND_RESULT: RoundResult = {
  question: MOCK_PICKED_BLOCK_QUESTION,
  nextRoundLabel: "Final Round — 2010s",
  results: [{ playerId: "p6", pointsGained: 200, correct: true, answeredIndex: 0 }],
};

// Matches the TV flow's actual computed standings: Cassette Ghost (740)
// finishes 1st, Blorbo (710) finishes 2nd — see MOCK_ROUND_RESULT /
// MOCK_FINAL_ROUND_RESULT.
export const MOCK_FINAL_STANDING: FinalStanding = {
  playerName: "You",
  rank: 2,
  totalPlayers: 6,
  score: 710,
  winnerName: "Cassette Ghost",
  winnerScore: 740,
};
