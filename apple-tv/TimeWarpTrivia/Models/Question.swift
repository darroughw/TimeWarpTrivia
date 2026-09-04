import Foundation

// Raw `questions` table row — mirrors lib/database.types.ts's QuestionRow.
// Exactly one of decadeId/deepCutTopicId is set, enforced at the DB level
// by questions_exactly_one_source.
struct QuestionRow: Codable, Identifiable, Equatable {
    let id: UUID
    let decadeId: DecadeId?
    let categoryId: String?
    let deepCutTopicId: String?
    let text: String
    let options: [String]
    let correctIndex: Int
    let flavorWrong: String?
    let isActive: Bool
    let createdAt: Date
}

// Round-context a given question id represents for a room — mirrors
// QuestionService.questionMetaForRoom's return type. Keyed off the room's
// own fields rather than room.status, so it stays correct regardless of
// exactly when a re-fetch happens relative to a status transition.
struct QuestionMeta: Equatable {
    let roundLabel: String
    let timeLimitSeconds: Int
    let pointsMultiplier: Int
}

// The domain-level question shown on screen — mirrors lib/types.ts's
// Question. `options` is always exactly 4 entries (DB check constraint).
struct Question: Identifiable, Equatable {
    let id: String
    let roundLabel: String
    let decadeId: DecadeId?
    let text: String
    let options: [String]
    let correctIndex: Int
    let timeLimitSeconds: Int
    let pointsMultiplier: Int

    init(row: QuestionRow, meta: QuestionMeta) {
        // Postgres/JS render uuid columns lowercase; Foundation's
        // UUID.uuidString is uppercase. Room.currentQuestionId/questionIds/
        // blockCandidateIds are plain-string comparisons against this id
        // elsewhere (RoomService, GameFlowViewModel) — lowercasing here is
        // what keeps those comparisons matching the DB's own casing.
        id = row.id.uuidString.lowercased()
        roundLabel = meta.roundLabel
        decadeId = row.decadeId
        text = row.text
        options = row.options
        correctIndex = row.correctIndex
        timeLimitSeconds = meta.timeLimitSeconds
        pointsMultiplier = meta.pointsMultiplier
    }
}

// Answer-choice labels for Question.options, in order — mirrors
// lib/types.ts's OPTION_LETTERS.
enum OptionLetter {
    static let all = ["A", "B", "C", "D"]
}

// How long the round-start countdown holds before a round's first
// question appears — mirrors lib/types.ts's ROUND_START_COUNTDOWN_SECONDS.
let roundStartCountdownSeconds = 5

struct PlayerPointResult: Identifiable, Equatable {
    var id: String { playerId }
    let playerId: String
    let pointsGained: Int
    let correct: Bool
    let answeredIndex: Int?
}

struct RoundResult: Equatable {
    let question: Question
    let results: [PlayerPointResult]
    let nextRoundLabel: String
}
