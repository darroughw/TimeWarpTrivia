import Foundation

// Mirrors lib/database.types.ts's RoomStatus — a room's status is the
// single source of truth for which screen every connected client (this
// app, and every player's phone) renders. Raw values are literally
// camelCase, not snake_case — confirmed against the schema: `status` is
// a plain `text` column with no DB check constraint, so the TypeScript
// union (and this enum) is the sole source of truth for the exact
// strings. Round 3 (the final, double-points round) reuses
// "question"/"transition" like rounds 1-2 — which round is live is
// derived from question_index, not a separate status. See
// QuestionService.questionMetaForRoom.
enum RoomStatus: String, Codable, Equatable {
    case lobby
    case countdown
    case question
    case transition
    case scoreboard
    case block
    case soloQuestion
    case soloTransition
    case end
}
