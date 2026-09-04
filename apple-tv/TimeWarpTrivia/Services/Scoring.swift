import Foundation

// Direct port of lib/scoring.ts. Speed-based: a correct answer is worth
// more the faster it's submitted. Wrong/unanswered is always 0.
// Client-computed and client-trusted, same as the web app — no
// server-side validation exists for this (or needs to, for this plan).
enum Scoring {
    private static let minPoints = 50.0
    private static let maxPoints = 200.0

    private static func points(forRatio ratio: Double, multiplier: Int) -> Int {
        let clamped = max(0, min(1, ratio))
        // JS's Math.round rounds half away from zero, matching Swift's
        // .rounded() default (.toNearestOrAwayFromZero) — Int(_: Double)
        // alone would truncate instead of round and silently under-score
        // by up to a point.
        return Int(((minPoints + (maxPoints - minPoints) * clamped) * Double(multiplier)).rounded())
    }

    static func computeScore(correct: Bool, responseTimeMs: Int, timeLimitSeconds: Int, multiplier: Int = 1) -> Int {
        guard correct else { return 0 }
        let timeLimitMs = Double(timeLimitSeconds) * 1000
        return points(forRatio: 1 - Double(responseTimeMs) / timeLimitMs, multiplier: multiplier)
    }

    // What a correct answer would be worth *right now* — same decay curve
    // as computeScore, but driven by the countdown's whole-second
    // remaining value instead of an actual response time.
    static func pointsRemaining(secondsRemaining: Int, timeLimitSeconds: Int, multiplier: Int = 1) -> Int {
        let ratio = timeLimitSeconds > 0 ? Double(secondsRemaining) / Double(timeLimitSeconds) : 0
        return points(forRatio: ratio, multiplier: multiplier)
    }
}
