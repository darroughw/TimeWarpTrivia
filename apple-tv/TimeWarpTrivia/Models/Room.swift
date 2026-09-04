import Foundation

// Mirrors lib/database.types.ts's RoomRow / supabase/migrations/0001_init.sql
// + 0003_round_structure.sql's rooms table. Decoded with
// JSONDecoder.keyDecodingStrategy = .convertFromSnakeCase (configured
// once in SupabaseService), so property names here are the camelCase
// equivalent of the actual snake_case columns and need no manual
// CodingKeys.
struct Room: Codable, Identifiable, Equatable {
    let id: UUID
    let code: String
    // Stored as `text` in Postgres (client-generated, not a real auth
    // id) — kept as String, not UUID, to match the column type exactly.
    let hostId: String
    var status: RoomStatus
    var currentQuestionId: String?
    var blockerPlayerId: UUID?
    var decadeFilter: DecadeId
    var blockCandidateIds: [String]?
    var questionIds: [String]?
    var questionIndex: Int?
    var askedQuestionIds: [String]
    var deepCutTopicId: String?
    let createdAt: Date
}
