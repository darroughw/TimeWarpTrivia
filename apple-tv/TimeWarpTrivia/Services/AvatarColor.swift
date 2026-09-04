import SwiftUI

// Direct port of lib/avatar.ts's getAvatarForName — must match byte-for-
// byte, since a player's color is derived independently on this app and
// on their own phone (only the emoji is stored in players.avatar; color
// is never persisted). Any drift here shows a different color for the
// same player on each screen.
enum AvatarColor {
    private static let emojis = ["🎮", "🕹️", "📼", "💾", "📟", "🛸", "🦖", "👾"]
    private static let colors: [Color] = [
        Color(hex: 0xFF3FA4),
        Color(hex: 0x7C5CFF),
        Color(hex: 0x33D6FF),
        Color(hex: 0xFF8A3D),
        Color(hex: 0x2DD4BF),
        Color(hex: 0xFFB238),
    ]

    // JS: hash = (hash * 31 + charCodeAt(i)) >>> 0 — unsigned 32-bit
    // wraparound over UTF-16 code units. Swift's `String.utf16` iterates
    // UTF-16 code units identically to JS's charCodeAt, including for
    // names containing surrogate-pair characters (e.g. some emoji).
    private static func hash(_ value: String) -> UInt32 {
        var hash: UInt32 = 0
        for unit in value.utf16 {
            hash = hash &* 31 &+ UInt32(unit)
        }
        return hash
    }

    static func avatar(forName name: String) -> (emoji: String, color: Color) {
        let normalized = name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let key = normalized.isEmpty ? "player" : normalized
        let h = hash(key)
        return (
            emoji: emojis[Int(h) % emojis.count],
            color: colors[Int(h) % colors.count]
        )
    }
}
