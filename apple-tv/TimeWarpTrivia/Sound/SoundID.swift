import Foundation

// Direct port of lib/sounds.ts's SoundName. See that file's comment for
// sourcing/licensing (Mixkit for the SFX, CC0/opengameart for the decade
// stings — Mixkit's music license, distinct from its SFX license,
// excludes video games).
enum SoundID: String, CaseIterable {
    case correct
    case wrong
    case tick
    case trombone
    case join
    case whoosh
    case block
    case fanfare
    case decade60s
    case decade70s
    case decade80s
    case decade90s
    case decade2000s
    case decade2010s

    var filename: String {
        switch self {
        case .correct: return "correct"
        case .wrong: return "wrong"
        case .tick: return "tick"
        case .trombone: return "trombone"
        case .join: return "join"
        case .whoosh: return "whoosh"
        case .block: return "block"
        case .fanfare: return "fanfare"
        case .decade60s: return "decade-60s"
        case .decade70s: return "decade-70s"
        case .decade80s: return "decade-80s"
        case .decade90s: return "decade-90s"
        case .decade2000s: return "decade-2000s"
        case .decade2010s: return "decade-2010s"
        }
    }
}

// Mirrors lib/sounds.ts's DECADE_STING_SOUND. No entry for "all" — All
// Decades stays on the neutral/default theme, so it gets no themed sting
// either.
extension DecadeId {
    var stingSound: SoundID? {
        switch self {
        case .sixties: return .decade60s
        case .seventies: return .decade70s
        case .eighties: return .decade80s
        case .nineties: return .decade90s
        case .twoThousands: return .decade2000s
        case .twentyTens: return .decade2010s
        case .all: return nil
        }
    }
}
