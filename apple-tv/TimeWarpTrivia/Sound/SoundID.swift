import Foundation

// Direct port of lib/sounds.ts's SoundName. See that file's comment for
// sourcing (all original, rendered by scripts/compose-audio.mjs).
enum SoundID: String, CaseIterable {
    case correct
    case wrong
    case tick
    case trombone
    case join
    case whoosh
    case block
    case fanfare
    case decadeSting

    // Rendered by scripts/compose-audio.mjs as AAC — no MP3 encoder is
    // available on the build machine.
    var fileExtension: String { "m4a" }

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
        case .decadeSting: return "decade-sting"
        }
    }
}

// Mirrors lib/sounds.ts's playDecadeSting: one shared sting for every
// decade, none for "all" (All Decades stays on the neutral theme).
extension DecadeId {
    var stingSound: SoundID? {
        self == .all ? nil : .decadeSting
    }
}
