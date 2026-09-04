import Foundation

// "left" is only ever set by an explicit host action — there's no
// automatic disconnect detection. See supabase/migrations/0004_player_status.sql.
enum PlayerStatus: String, Codable, Equatable {
    case active
    case left
}

// Mirrors lib/database.types.ts's PlayerRow. `avatar` stores only the
// emoji — display color is deterministically re-derived from `name` by
// AvatarColor.getAvatarForName, never stored (see lib/avatar.ts).
struct Player: Codable, Identifiable, Equatable {
    let id: UUID
    let roomId: UUID
    let name: String
    let avatar: String
    var score: Int
    var status: PlayerStatus
    let createdAt: Date
}
