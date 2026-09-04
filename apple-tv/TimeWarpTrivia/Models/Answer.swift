import Foundation

// Mirrors lib/database.types.ts's AnswerRow. unique(player_id, question_id)
// is enforced at the DB level — see supabase/migrations/0001_init.sql.
struct Answer: Codable, Identifiable, Equatable {
    let id: UUID
    let roomId: UUID
    let playerId: UUID
    let questionId: String
    let answer: Int
    let responseTimeMs: Int
    let createdAt: Date
}
