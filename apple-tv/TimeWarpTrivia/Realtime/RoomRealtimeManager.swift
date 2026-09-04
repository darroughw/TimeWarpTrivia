import Foundation
import Supabase

// Direct port of hooks/useRoomRealtime.ts: one-shot initial REST fetch
// (room + players, ordered by created_at) before subscribing, then two
// Postgres Changes listeners on the same `room-<id>` channel — UPDATE on
// `rooms` replaces room state wholesale from the new row, INSERT/UPDATE
// on `players` (scoped to this room) append-or-replace by id.
@MainActor
final class RoomRealtimeManager {
    private(set) var room: Room?
    private(set) var players: [Player] = []

    var onRoomChange: ((Room) -> Void)?
    var onPlayersChange: (([Player]) -> Void)?

    private var channel: RealtimeChannelV2?
    private var subscriptions: [RealtimeSubscription] = []

    func start(roomId: UUID) async throws {
        await stop()

        async let roomFetch: Room = SupabaseService.client
            .from("rooms")
            .select()
            .eq("id", value: roomId.uuidString)
            .single()
            .execute()
            .value

        async let playersFetch: [Player] = SupabaseService.client
            .from("players")
            .select()
            .eq("room_id", value: roomId.uuidString)
            .order("created_at", ascending: true)
            .execute()
            .value

        let (initialRoom, initialPlayers) = try await (roomFetch, playersFetch)
        room = initialRoom
        players = initialPlayers
        onRoomChange?(initialRoom)
        onPlayersChange?(initialPlayers)

        let channel = SupabaseService.client.channel("room-\(roomId.uuidString)")
        self.channel = channel
        let decoder = SupabaseService.decoder
        let roomIdFilter: RealtimePostgresFilter = .eq("id", value: roomId.uuidString)
        let roomIdColumnFilter: RealtimePostgresFilter = .eq("room_id", value: roomId.uuidString)

        let roomSub = channel.onPostgresChange(
            UpdateAction.self,
            table: "rooms",
            filter: roomIdFilter
        ) { [weak self] (update: UpdateAction) in
            guard let self, let updated = try? update.decodeRecord(as: Room.self, decoder: decoder) else { return }
            Task { @MainActor in
                self.room = updated
                self.onRoomChange?(updated)
            }
        }

        let playerInsertSub = channel.onPostgresChange(
            InsertAction.self,
            table: "players",
            filter: roomIdColumnFilter
        ) { [weak self] (insert: InsertAction) in
            guard let self, let inserted = try? insert.decodeRecord(as: Player.self, decoder: decoder) else { return }
            Task { @MainActor in
                guard !self.players.contains(where: { $0.id == inserted.id }) else { return }
                self.players.append(inserted)
                self.onPlayersChange?(self.players)
            }
        }

        let playerUpdateSub = channel.onPostgresChange(
            UpdateAction.self,
            table: "players",
            filter: roomIdColumnFilter
        ) { [weak self] (update: UpdateAction) in
            guard let self, let updated = try? update.decodeRecord(as: Player.self, decoder: decoder) else { return }
            Task { @MainActor in
                guard let index = self.players.firstIndex(where: { $0.id == updated.id }) else { return }
                self.players[index] = updated
                self.onPlayersChange?(self.players)
            }
        }

        subscriptions = [roomSub, playerInsertSub, playerUpdateSub]
        try await channel.subscribeWithError()
    }

    func stop() async {
        subscriptions.removeAll()
        if let channel {
            await SupabaseService.client.removeChannel(channel)
        }
        channel = nil
        room = nil
        players = []
    }
}
