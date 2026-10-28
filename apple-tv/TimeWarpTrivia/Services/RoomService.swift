import Foundation
import Supabase

// Direct port of lib/roomService.ts. Every function here talks straight to
// Supabase via the anon key — there is no server layer to call instead
// (confirmed: no app/api/** routes exist in the web app either).
enum RoomService {
    // No O/I — easy to misread on a TV. Matches lib/roomService.ts's
    // CODE_LETTERS exactly.
    private static let codeLetters = Array("ABCDEFGHJKLMNPQRSTUVWXYZ")
    private static let maxCodeAttempts = 5

    private static func generateRoomCode() -> String {
        let letters = (0..<4).map { _ in String(codeLetters.randomElement()!) }.joined()
        let digits = String(format: "%02d", Int.random(in: 0..<100))
        return "\(letters)-\(digits)"
    }

    private struct NewRoomPayload: Encodable {
        let code: String
        let hostId: String
        let status = RoomStatus.lobby
        let decadeFilter = DecadeId.all
    }

    static func createRoom(hostId: String) async throws -> Room {
        for _ in 0..<maxCodeAttempts {
            let code = generateRoomCode()
            do {
                let room: Room = try await SupabaseService.client
                    .from("rooms")
                    .insert(NewRoomPayload(code: code, hostId: hostId))
                    .select()
                    .single()
                    .execute()
                    .value
                return room
            } catch let error as PostgrestError {
                // Anything but "code already taken" is fatal.
                if error.code != "23505" { throw error }
            }
        }
        throw RoomServiceError.couldNotGenerateUniqueCode
    }

    static func updateRoom(roomId: UUID, patch: some Encodable) async throws {
        try await SupabaseService.client
            .from("rooms")
            .update(patch)
            .eq("id", value: roomId.uuidString)
            .execute()
    }

    // Host-initiated removal — the only way a player's status ever
    // changes. Doesn't delete the row: score and answers stay intact,
    // they're just excluded from block-picker selection and active
    // counts from here on.
    static func removePlayer(playerId: UUID) async throws {
        try await SupabaseService.client
            .from("players")
            .update(["status": PlayerStatus.left.rawValue])
            .eq("id", value: playerId.uuidString)
            .execute()
    }

    static func resetActivePlayerScores(roomId: UUID) async throws {
        try await SupabaseService.client
            .from("players")
            .update(["score": 0])
            .eq("room_id", value: roomId.uuidString)
            .eq("status", value: PlayerStatus.active.rawValue)
            .execute()
    }

    static func clearRoomAnswers(roomId: UUID) async throws {
        try await SupabaseService.client
            .from("answers")
            .delete()
            .eq("room_id", value: roomId.uuidString)
            .execute()
    }

    static func setDecadeFilter(roomId: UUID, decadeFilter: DecadeId) async throws {
        try await updateRoom(roomId: roomId, patch: DecadeFilterPatch(decadeFilter: decadeFilter))
    }

    static func setDeepCutTopic(roomId: UUID, topicId: String) async throws {
        try await updateRoom(roomId: roomId, patch: DeepCutTopicPatch(deepCutTopicId: topicId))
    }

    static func clearDeepCutTopic(roomId: UUID) async throws {
        try await updateRoom(roomId: roomId, patch: ClearDeepCutTopicPatch())
    }
}

enum RoomServiceError: Error, LocalizedError {
    case couldNotGenerateUniqueCode

    var errorDescription: String? {
        switch self {
        case .couldNotGenerateUniqueCode:
            return "Couldn't generate a unique room code — try again."
        }
    }
}
