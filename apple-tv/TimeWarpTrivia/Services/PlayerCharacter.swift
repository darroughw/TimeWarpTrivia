import Foundation

// Direct port of lib/characters.ts: the 24 player characters, each
// identified by the emoji stored in players.avatar. The artwork lives in
// Assets.xcassets/Characters/<id>.imageset (vector SVGs exported from the
// project's Figma file, same files as public/characters/). Avatars that
// aren't one of these emoji — rows from before characters existed —
// still render as the emoji itself.
struct PlayerCharacter: Equatable {
    let id: String
    let name: String
    let emoji: String

    // Asset catalog name; the Characters folder provides a namespace.
    var imageName: String { "Characters/\(id)" }

    static let all: [PlayerCharacter] = [
        .init(id: "bolt", name: "Bolt", emoji: "🎮"),
        .init(id: "visor", name: "Visor", emoji: "🕹️"),
        .init(id: "tin", name: "Tin", emoji: "📼"),
        .init(id: "prop", name: "Prop", emoji: "💾"),
        .init(id: "fang", name: "Fang", emoji: "📟"),
        .init(id: "zorp", name: "Zorp", emoji: "🛸"),
        .init(id: "fuzz", name: "Fuzz", emoji: "🦖"),
        .init(id: "blip", name: "Blip", emoji: "👾"),
        .init(id: "blob", name: "Blob", emoji: "📺"),
        .init(id: "frank", name: "Frank", emoji: "🎸"),
        .init(id: "nova", name: "Nova", emoji: "🛹"),
        .init(id: "gloop", name: "Gloop", emoji: "💿"),
        .init(id: "max", name: "Max", emoji: "👓"),
        .init(id: "jo", name: "Jo", emoji: "🧶"),
        .init(id: "ray", name: "Ray", emoji: "🎷"),
        .init(id: "nina", name: "Nina", emoji: "📚"),
        .init(id: "kiko", name: "Kiko", emoji: "🍡"),
        .init(id: "gus", name: "Gus", emoji: "🧪"),
        .init(id: "remy", name: "Remy", emoji: "🎳"),
        .init(id: "lou", name: "Lou", emoji: "🎨"),
        .init(id: "mae", name: "Mae", emoji: "🌼"),
        .init(id: "zed", name: "Zed", emoji: "🤘"),
        .init(id: "ollie", name: "Ollie", emoji: "🧢"),
        .init(id: "bea", name: "Bea", emoji: "🎀"),
    ]

    // Emoji presentation selectors (U+FE0F) come and go between keyboards
    // and databases — "🕹️" and "🕹" are the same avatar.
    private static func normalize(_ emoji: String) -> String {
        emoji.replacingOccurrences(of: "\u{FE0F}", with: "")
    }

    private static let byEmoji: [String: PlayerCharacter] = Dictionary(
        uniqueKeysWithValues: all.map { (normalize($0.emoji), $0) }
    )

    static func forAvatar(_ avatar: String) -> PlayerCharacter? {
        byEmoji[normalize(avatar)]
    }
}
