// The 24 player characters — robots, monsters, aliens, and people, drawn in
// the project's Figma file (page "Player Characters") and exported to
// public/characters/<id>.svg (and the Apple TV asset catalog's
// Characters folder; see apple-tv/TimeWarpTrivia/Services/PlayerCharacter.swift).
//
// players.avatar still stores an emoji, never a character id: each
// character is identified by its emoji below. That keeps older clients
// (Apple TV builds already in the App Store render players.avatar as
// text) showing a sensible emoji, while updated clients draw the
// character. Anything that isn't one of these emoji — rows from before
// characters existed — falls back to rendering the emoji itself.
export interface Character {
  id: string;
  name: string;
  emoji: string;
}

export const CHARACTERS: Character[] = [
  { id: "bolt", name: "Bolt", emoji: "🎮" },
  { id: "visor", name: "Visor", emoji: "🕹️" },
  { id: "tin", name: "Tin", emoji: "📼" },
  { id: "prop", name: "Prop", emoji: "💾" },
  { id: "fang", name: "Fang", emoji: "📟" },
  { id: "zorp", name: "Zorp", emoji: "🛸" },
  { id: "fuzz", name: "Fuzz", emoji: "🦖" },
  { id: "blip", name: "Blip", emoji: "👾" },
  { id: "blob", name: "Blob", emoji: "📺" },
  { id: "frank", name: "Frank", emoji: "🎸" },
  { id: "nova", name: "Nova", emoji: "🛹" },
  { id: "gloop", name: "Gloop", emoji: "💿" },
  { id: "max", name: "Max", emoji: "👓" },
  { id: "jo", name: "Jo", emoji: "🧶" },
  { id: "ray", name: "Ray", emoji: "🎷" },
  { id: "nina", name: "Nina", emoji: "📚" },
  { id: "kiko", name: "Kiko", emoji: "🍡" },
  { id: "gus", name: "Gus", emoji: "🧪" },
  { id: "remy", name: "Remy", emoji: "🎳" },
  { id: "lou", name: "Lou", emoji: "🎨" },
  { id: "mae", name: "Mae", emoji: "🌼" },
  { id: "zed", name: "Zed", emoji: "🤘" },
  { id: "ollie", name: "Ollie", emoji: "🧢" },
  { id: "bea", name: "Bea", emoji: "🎀" },
];

// Emoji presentation selectors (U+FE0F) come and go between keyboards,
// databases, and JSON round-trips — "🕹️" and "🕹" are the same avatar.
const normalize = (emoji: string) => emoji.replace(/️/g, "");

const BY_EMOJI = new Map(CHARACTERS.map((c) => [normalize(c.emoji), c]));

export function characterForAvatar(avatar: string): Character | undefined {
  return BY_EMOJI.get(normalize(avatar));
}

export function characterImageSrc(character: Character): string {
  return `/characters/${character.id}.svg`;
}

export function randomCharacter(): Character {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
}
