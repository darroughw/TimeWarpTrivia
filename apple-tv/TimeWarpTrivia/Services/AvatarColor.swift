import SwiftUI

// Direct port of lib/avatar.ts's getAvatarForName/playerRowToPlayer —
// must match byte-for-byte, since a player's color is derived
// independently on this app and on their own phone. The emoji is the
// other half of that same JS function's output, but playerRowToPlayer
// deliberately discards it and uses the *stored* players.avatar column
// instead (see Player.avatar) — the hash's emoji output is only ever
// used client-side, to suggest one when a player is first choosing a
// name/avatar to join with, not for rendering an existing player. This
// type exposes color only, on purpose, so nothing here can accidentally
// re-derive a different emoji than what's actually stored.
enum AvatarColor {
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

    static func color(forName name: String) -> Color {
        let normalized = name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let key = normalized.isEmpty ? "player" : normalized
        return colors[Int(hash(key)) % colors.count]
    }
}
