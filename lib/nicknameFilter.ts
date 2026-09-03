// Lightweight blocklist for the free-text display-name field on
// JoinScreen. Not exhaustive content moderation — just enough to keep
// the obvious slurs and profanity off a screen the whole room shares,
// which is what Google Play's User Generated Content policy expects for
// any user-visible text, however minimal. Paired with the host's
// RemovePlayerButton for anything this list misses.
const BLOCKED_TERMS = [
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "tranny",
  "chink",
  "spic",
  "kike",
  "wetback",
  "gook",
  "coon",
  "beaner",
  "cunt",
  "whore",
  "slut",
  "rape",
  "rapist",
  "nazi",
  "hitler",
  "fuck",
  "shit",
  "bitch",
  "dick",
  "pussy",
  "cock",
  "asshole",
  "bastard",
];

// Collapse to lowercase letters/digits only so spacing, punctuation, or
// case can't be used to slip a blocked term past a plain substring check.
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isNicknameAllowed(name: string): boolean {
  const normalized = normalize(name);
  if (!normalized) return true;
  return !BLOCKED_TERMS.some((term) => normalized.includes(term));
}
