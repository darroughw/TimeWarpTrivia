// Shared step content for the illustrated help modal (TIM-39). One source
// of truth so the landing page, TV lobby, and phone join screen can't
// drift out of sync with each other — or with the real mechanics spec
// (CLAUDE.md's Game Mechanics section).

export type HelpIconName = "tv" | "calendar" | "code" | "play" | "phone" | "bolt" | "spotlight" | "trophy";

export interface HelpStep {
  icon: HelpIconName;
  title: string;
  body: string;
}

export const HOSTING_STEPS: HelpStep[] = [
  {
    icon: "tv",
    title: "Open the shared screen",
    body: "Pull up timewarptrivia.com on a TV, laptop, or monitor — whatever the whole room can see. You'll get a room code.",
  },
  {
    icon: "calendar",
    title: "Pick a decade",
    body: "Filter to one decade (80s–2010s) or open it up to all four. You can change it right up until you start.",
  },
  {
    icon: "code",
    title: "Wait for players",
    body: "Everyone else grabs their phone, enters the room code and a name, and shows up live in your player list.",
  },
  {
    icon: "play",
    title: "Start the game",
    body: "2 to 10 players. Once everyone's in, hit start — the shared screen runs the show from here.",
  },
];

export const PLAYING_STEPS: HelpStep[] = [
  {
    icon: "phone",
    title: "Join from your phone",
    body: "No app, no download. Just the room code and your name — your phone becomes your buzzer.",
  },
  {
    icon: "bolt",
    title: "Answer fast, answer right",
    body: "Every question's speed-scored: a correct answer is worth more the faster you lock it in. Wrong or no answer scores zero — no penalty beyond that.",
  },
  {
    icon: "spotlight",
    title: "Watch for the twist",
    body: "Before the final round, whoever's in last place picks one question to answer completely alone. Everyone else just watches.",
  },
  {
    icon: "trophy",
    title: "Final round pays double",
    body: "The last round is worth 2x points — anything can still happen. Ranked leaderboard and a podium once it's over.",
  },
];
