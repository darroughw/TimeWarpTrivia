import Foundation

// The single "brain" of the app — direct port of app/_game/LiveTvFlow.tsx.
// Every screen (Views/*.swift) is pure presentation reading published state
// off this object; every state-machine edge is a method here, matching the
// web version's handlers 1:1.
@MainActor
final class GameFlowViewModel: ObservableObject {
    @Published private(set) var room: Room?
    @Published private(set) var players: [Player] = []
    @Published private(set) var decades: [Decade] = []
    @Published private(set) var isStartingGame = false
    @Published var lastError: String?

    // Fresh per app-launch, mirrors LiveTvFlow.tsx's `useState(() => crypto.randomUUID())`.
    private let hostId = UUID().uuidString

    private let roomRealtime = RoomRealtimeManager()

    var activePlayerCount: Int {
        players.filter { $0.status == .active }.count
    }

    var canStartGame: Bool {
        activePlayerCount >= 2
    }

    // Creates a fresh room the moment the app boots up — mirrors
    // LiveTvFlow.tsx's mount-time createRoom effect.
    func bootstrap() async {
        roomRealtime.onRoomChange = { [weak self] room in
            self?.room = room
        }
        roomRealtime.onPlayersChange = { [weak self] players in
            self?.players = players
        }

        do {
            let newRoom = try await RoomService.createRoom(hostId: hostId)
            try await roomRealtime.start(roomId: newRoom.id)
        } catch {
            lastError = error.localizedDescription
        }

        // The lobby's decade filter is data-driven — fetched once, not
        // hardcoded — so a new decade becomes a data change, not a code
        // deploy.
        do {
            decades = try await QuestionService.fetchDecades()
        } catch {
            lastError = error.localizedDescription
        }
    }

    func selectDecade(_ id: DecadeId) {
        guard let room else { return }
        Task {
            do {
                try await RoomService.setDecadeFilter(roomId: room.id, decadeFilter: id)
            } catch {
                lastError = error.localizedDescription
            }
        }
    }

    func removePlayer(_ player: Player) {
        Task {
            do {
                try await RoomService.removePlayer(playerId: player.id)
            } catch {
                lastError = error.localizedDescription
            }
        }
    }

    // Picks the whole game's question set at once — 15 main questions (3
    // rounds of 5) plus 3 block candidates, all respecting the room's
    // decade filter and all guaranteed distinct from one another and from
    // anything asked in a previous rematch in this room.
    func handleStartGame() async {
        guard let room, canStartGame, !isStartingGame else { return }
        isStartingGame = true
        defer { isStartingGame = false }

        do {
            let picks = try await QuestionService.fetchRandomQuestionSet(
                source: .decade(room.decadeFilter),
                count: totalMainQuestions + 3,
                excludeIds: room.askedQuestionIds
            )
            let questionIds = picks.prefix(totalMainQuestions).map { $0.id.uuidString.lowercased() }
            let blockCandidateIds = picks.suffix(from: totalMainQuestions).map { $0.id.uuidString.lowercased() }

            try await RoomService.updateRoom(
                roomId: room.id,
                patch: StartGamePatch(
                    questionIds: Array(questionIds),
                    currentQuestionId: questionIds[0],
                    blockCandidateIds: Array(blockCandidateIds)
                )
            )
        } catch {
            lastError = error.localizedDescription
        }
    }
}

// 3 rounds of 5 questions each, in question_ids: round 1 = [0,5), round 2
// = [5,10), round 3 (final, double points) = [10,15). Mirrors
// LiveTvFlow.tsx's QUESTIONS_PER_ROUND/TOTAL_MAIN_QUESTIONS.
let questionsPerRound = 5
let totalMainQuestions = questionsPerRound * 3
