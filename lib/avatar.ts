const AVATAR_EMOJIS = ["🎮", "🕹️", "📼", "💾", "📟", "🛸", "🦖", "👾"];
const AVATAR_COLORS = ["#ff3fa4", "#7c5cff", "#33d6ff", "#ff8a3d", "#2dd4bf", "#ffb238"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Deterministically picks an emoji + color for a player-entered name, so a
// self-avatar stays stable across renders without needing a real account.
export function getAvatarForName(name: string): { emoji: string; color: string } {
  const hash = hashString(name.trim().toLowerCase() || "player");
  return {
    emoji: AVATAR_EMOJIS[hash % AVATAR_EMOJIS.length],
    color: AVATAR_COLORS[hash % AVATAR_COLORS.length],
  };
}
