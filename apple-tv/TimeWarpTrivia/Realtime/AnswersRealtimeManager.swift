import Foundation
import Supabase

// Direct port of hooks/useRoomAnswers.ts: initial REST fetch of every
// answer already collected for the room, then INSERT-only Postgres
// Changes on `answers-<id>` (answers are never updated in place; deletes
// from Play Again's clearRoomAnswers aren't listened for here — the
// caller manually clears local state right after that RPC succeeds, same
// as the web hook's `clearAnswers()`).
@MainActor
final class AnswersRealtimeManager {
    private(set) var answers: [Answer] = []

    var onAnswersChange: (([Answer]) -> Void)?

    private var channel: RealtimeChannelV2?
    private var subscription: RealtimeSubscription?

    func start(roomId: UUID) async throws {
        await stop()

        let initial: [Answer] = try await SupabaseService.client
            .from("answers")
            .select()
            .eq("room_id", value: roomId.uuidString)
            .execute()
            .value
        answers = initial
        onAnswersChange?(initial)

        let channel = SupabaseService.client.channel("answers-\(roomId.uuidString)")
        self.channel = channel
        let decoder = SupabaseService.decoder
        let roomIdFilter: RealtimePostgresFilter = .eq("room_id", value: roomId.uuidString)

        subscription = channel.onPostgresChange(
            InsertAction.self,
            table: "answers",
            filter: roomIdFilter
        ) { [weak self] (insert: InsertAction) in
            guard let self, let inserted = try? insert.decodeRecord(as: Answer.self, decoder: decoder) else { return }
            Task { @MainActor in
                guard !self.answers.contains(where: { $0.id == inserted.id }) else { return }
                self.answers.append(inserted)
                self.onAnswersChange?(self.answers)
            }
        }

        try await channel.subscribeWithError()
    }

    // Mirrors the web hook's clearAnswers() — called by the owner right
    // after RoomService.clearRoomAnswers succeeds (Play Again), since
    // there's no DELETE subscription to react to it automatically.
    func clearLocal() {
        answers = []
        onAnswersChange?(answers)
    }

    func stop() async {
        subscription = nil
        if let channel {
            await SupabaseService.client.removeChannel(channel)
        }
        channel = nil
        answers = []
    }
}
