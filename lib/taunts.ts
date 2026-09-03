import { rankedByScore } from "@/lib/mockData";
import type { Player } from "@/lib/types";

// Dry, deadpan jabs at whoever isn't in first place between questions
// (TIM-13 tone: dark humor, never cruel or mean-spirited). `{name}` is
// swapped for the target player's name. Kept plural/varied so the same
// line doesn't show up every single question.
const TAUNT_TEMPLATES = [
  "{name} is currently mounting a historic comeback. Historically, from here, it never works.",
  "{name} is, technically, still in the game. Legally too.",
  "Somewhere out there, {name} is beating someone. Not in this room, but somewhere.",
  "{name} has entered the \"it's not about winning\" phase of the evening.",
  "Good news for {name}: nowhere to go but up. Bad news: there's a lot of up.",
  "{name} is playing a different game. That game is called Catching Up.",
  "Rumor has it {name} peaked during the lobby screen.",
  "{name}'s strategy appears to be letting everyone else go first. Bold.",
  "Nobody's told {name} yet, but there is, in fact, a scoreboard.",
  "{name} remains undefeated in the category of Not First Place.",
  "{name} is saving their best round for later. Presumably.",
  "Statistically, {name} could still win this. Statisticians hate that framing too.",
];

function formatTaunt(template: string, name: string): string {
  return template.replace("{name}", name);
}

// Picks one active, non-first-place player at random and returns a random
// taunt line for them. Returns null when there's no one to taunt — every
// active player tied for the lead, or too few active players to rank.
export function pickTaunt(players: Player[]): string | null {
  const active = players.filter((p) => p.status === "active");
  if (active.length < 2) return null;

  const ranked = rankedByScore(active);
  const leadScore = ranked[0].score;
  const trailing = ranked.filter((p) => p.score < leadScore);
  if (trailing.length === 0) return null;

  const target = trailing[Math.floor(Math.random() * trailing.length)];
  const template = TAUNT_TEMPLATES[Math.floor(Math.random() * TAUNT_TEMPLATES.length)];
  return formatTaunt(template, target.name);
}

// End-of-game smack talk (EndGameScreen) — roasts the winner/last-place
// spread and, in the same breath, needles the room into hitting Play
// Again. `{winner}`/`{loser}` are swapped for the actual standings.
const END_GAME_LINES = [
  "{winner} wins it. {loser} already has excuses queued up for the rematch.",
  "{winner} takes the crown. Everyone else takes the L. Run it back.",
  "Congratulations, {winner}. The rest of you — we should talk. After another round.",
  "{winner} peaked at exactly the right moment. {loser} peaked during the lobby screen. Go again.",
  "That's a wrap. {loser} is already asking for a recount that will not be happening. Rematch instead.",
  "{winner} wins. {loser} would like it noted that the questions were unfair. Prove it — play again.",
  "History will remember {winner}. History will forget {loser} almost immediately. Fix that. Go again.",
  "Somewhere, {loser} is blaming the WiFi. Prove them wrong. Play again.",
];

// Picks a random smack-talk line pairing the game's actual winner and
// last-place finisher. Returns null when there aren't at least two active
// players to compare (nothing to say about a field of one).
export function pickEndGameLine(players: Player[]): string | null {
  const active = players.filter((p) => p.status === "active");
  if (active.length < 2) return null;

  const ranked = rankedByScore(active);
  const winner = ranked[0];
  const loser = ranked[ranked.length - 1];
  const template = END_GAME_LINES[Math.floor(Math.random() * END_GAME_LINES.length)];
  return template.replace("{winner}", winner.name).replace("{loser}", loser.name);
}
