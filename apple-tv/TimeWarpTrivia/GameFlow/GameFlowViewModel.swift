import Foundation

// The single "brain" of the app — direct port of app/_game/LiveTvFlow.tsx.
// Every screen (Views/*.swift) is pure presentation reading published state
// off this object; every state-machine edge is a method here, matching the
// web version's handlers 1:1.
@MainActor
final class GameFlowViewModel: ObservableObject {
    @Published private(set) var room: Room?
    @Published private(set) var players: [Player] = []
    @Published private(set) var answers: [Answer] = []
    @Published private(set) var decades: [Decade] = []
    @Published private(set) var isStartingGame = false
    @Published private(set) var countdownSecondsRemaining = roundStartCountdownSeconds
    @Published private(set) var lastRoundResult: RoundResult?
    @Published private(set) var currentQuestion: Question?
    @Published private(set) var blockCandidates: [Question] = []
    @Published var lastError: String?

    // Fresh per app-launch, mirrors LiveTvFlow.tsx's `useState(() => crypto.randomUUID())`.
    private let hostId = UUID().uuidString

    private let roomRealtime = RoomRealtimeManager()
    private let answersRealtime = AnswersRealtimeManager()

    // The whole game's 18 questions (15 main + 3 block candidates) are
    // picked once at Start Game and never change again for the life of
    // the room — cached locally by id rather than re-fetched per
    // question. Meta (roundLabel/timeLimitSeconds/pointsMultiplier) is
    // computed once, at cache time, straight from each question's
    // position in the picks — equivalent to, but cheaper than, calling
    // QuestionService.questionMeta(room:questionId:) again later.
    private var questionCache: [String: Question] = [:]

    private var countdownTask: Task<Void, Never>?
    private var countdownResetKey: String?
    private var currentQuestionTask: Task<Void, Never>?
    private var blockCandidatesTask: Task<Void, Never>?

    var activePlayerCount: Int {
        players.filter { $0.status == .active }.count
    }

    var canStartGame: Bool {
        activePlayerCount >= 2
    }

    var soloPlayer: Player? {
        guard let blockerPlayerId = room?.blockerPlayerId else { return nil }
        return players.first { $0.id == blockerPlayerId }
    }

    func answeredCount(for questionId: String) -> Int {
        answers.filter { $0.questionId == questionId }.count
    }

    // Creates a fresh room the moment the app boots up — mirrors
    // LiveTvFlow.tsx's mount-time createRoom effect.
    func bootstrap() async {
        SoundPlayer.shared.preloadAll()

        roomRealtime.onRoomChange = { [weak self] room in
            self?.room = room
            self?.syncCountdown()
            self?.resolveCurrentQuestion()
            self?.resolveBlockCandidates()
        }
        roomRealtime.onPlayersChange = { [weak self] players in
            self?.players = players
        }
        answersRealtime.onAnswersChange = { [weak self] answers in
            self?.answers = answers
        }

        do {
            let newRoom = try await RoomService.createRoom(hostId: hostId)
            try await roomRealtime.start(roomId: newRoom.id)
            try await answersRealtime.start(roomId: newRoom.id)
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
            let mainPicks = Array(picks.prefix(totalMainQuestions))
            let blockPicks = Array(picks.suffix(from: totalMainQuestions))

            for (index, row) in mainPicks.enumerated() {
                let round = index / questionsPerRound + 1
                let isFinal = round == 3
                let meta = QuestionMeta(
                    roundLabel: isFinal ? "Final Round" : "Round \(round)",
                    timeLimitSeconds: isFinal ? 15 : 20,
                    pointsMultiplier: isFinal ? 2 : 1
                )
                let question = Question(row: row, meta: meta)
                questionCache[question.id] = question
            }
            for row in blockPicks {
                let meta = QuestionMeta(roundLabel: "Solo Round", timeLimitSeconds: 15, pointsMultiplier: 1)
                let question = Question(row: row, meta: meta)
                questionCache[question.id] = question
            }

            let questionIds = mainPicks.map { $0.id.uuidString.lowercased() }
            let blockCandidateIds = blockPicks.map { $0.id.uuidString.lowercased() }

            try await RoomService.updateRoom(
                roomId: room.id,
                patch: StartGamePatch(
                    questionIds: questionIds,
                    currentQuestionId: questionIds[0],
                    blockCandidateIds: blockCandidateIds
                )
            )
        } catch {
            lastError = error.localizedDescription
        }
    }

    // The host's Select/swipe-right input on a passive screen
    // (transition/scoreboard/soloTransition) — the one method every
    // PassiveAdvanceContainer-wrapped screen calls.
    func handleAdvance() {
        guard let room, let step = RoundStepLogic.nextPassiveStep(from: room.status, questionIndex: room.questionIndex) else {
            return
        }
        Task {
            do {
                if (step.status == .question || step.status == .countdown),
                   let index = step.questionIndex,
                   let questionIds = room.questionIds,
                   index < questionIds.count {
                    try await RoomService.updateRoom(
                        roomId: room.id,
                        patch: AdvanceToQuestionPatch(status: step.status, questionIndex: index, currentQuestionId: questionIds[index])
                    )
                } else {
                    try await RoomService.updateRoom(roomId: room.id, patch: StatusPatch(status: step.status))
                }
            } catch {
                lastError = error.localizedDescription
            }
        }
    }

    // Builds the results breakdown for whichever question just ended,
    // purely from the answers already collected — each phone already
    // applied its own score to its own player row when it answered (see
    // RoomService.submitAnswer's JS counterpart), so this is for
    // *display* only. Called by QuestionView once, whether the question
    // ended by clock or by everyone answering.
    func handleQuestionTimeUp() async {
        guard let room, let question = currentQuestion, let currentQuestionId = room.currentQuestionId else { return }
        let nextStatus: RoomStatus = room.status == .soloQuestion ? .soloTransition : .transition

        let relevantAnswers = answers.filter { $0.questionId == currentQuestionId }
        let participants: [Player] =
            if room.status == .soloQuestion {
                players.filter { $0.id == room.blockerPlayerId }
            } else {
                players.filter { $0.status == .active }
            }

        let results: [PlayerPointResult] = participants.map { player in
            guard let answer = relevantAnswers.first(where: { $0.playerId == player.id }) else {
                return PlayerPointResult(playerId: player.id, pointsGained: 0, correct: false, answeredIndex: nil)
            }
            let correct = answer.answer == question.correctIndex
            let points = Scoring.computeScore(
                correct: correct,
                responseTimeMs: answer.responseTimeMs,
                timeLimitSeconds: question.timeLimitSeconds,
                multiplier: question.pointsMultiplier
            )
            return PlayerPointResult(playerId: player.id, pointsGained: points, correct: correct, answeredIndex: answer.answer)
        }

        let nextRoundLabel = RoundStepLogic.label(for: RoundStepLogic.nextPassiveStep(from: nextStatus, questionIndex: room.questionIndex))
        lastRoundResult = RoundResult(question: question, results: results, nextRoundLabel: nextRoundLabel)

        do {
            try await RoomService.updateRoom(roomId: room.id, patch: StatusPatch(status: nextStatus))
        } catch {
            lastError = error.localizedDescription
        }
    }

    // Round-start countdown auto-advances once it hits 0 — nobody presses
    // a button for this one, unlike the other passive stages. Keyed the
    // same way the web's useCountdown resetKey is
    // (room-status-questionIndex), so re-entering "countdown" at a
    // different question_index restarts the 5s clock cleanly, and a
    // realtime update that doesn't actually change any of those three
    // doesn't restart an already-running timer.
    private func syncCountdown() {
        guard let room, room.status == .countdown else {
            countdownTask?.cancel()
            countdownTask = nil
            countdownResetKey = nil
            return
        }
        let key = "\(room.id.uuidString)-\(room.status.rawValue)-\(room.questionIndex ?? -1)"
        guard key != countdownResetKey else { return }
        countdownResetKey = key
        countdownTask?.cancel()
        countdownSecondsRemaining = roundStartCountdownSeconds

        countdownTask = Task { [weak self] in
            var remaining = roundStartCountdownSeconds
            while remaining > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { return }
                remaining -= 1
                self?.countdownSecondsRemaining = remaining
            }
            await self?.handleCountdownFinished()
        }
    }

    // Resolves room.currentQuestionId into a full Question, mirroring
    // hooks/useCurrentQuestion.ts's behavior: check the local cache
    // first (the fast, synchronous path when this client itself called
    // handleStartGame and already has all 18 questions cached), but fall
    // back to a live fetch-by-id when it's missing — a fresh relaunch
    // mid-game, or any client that reconnects without having run
    // handleStartGame itself, has an empty cache and must still be able
    // to resolve the current question, the same as the web app always
    // does (it has no cross-question cache at all, just fetches by id
    // every time).
    private func resolveCurrentQuestion() {
        currentQuestionTask?.cancel()
        guard let room, let id = room.currentQuestionId else {
            currentQuestion = nil
            return
        }
        if let cached = questionCache[id] {
            currentQuestion = cached
            return
        }
        currentQuestionTask = Task { [weak self] in
            guard let self, let room = self.room else { return }
            let meta = QuestionService.questionMeta(room: room, questionId: id)
            guard let question = try? await QuestionService.fetchQuestion(id: id, meta: meta) else { return }
            guard !Task.isCancelled else { return }
            self.questionCache[id] = question
            // Only apply if still relevant — the room may have already
            // moved on to a different question while this was in flight.
            if self.room?.currentQuestionId == id {
                self.currentQuestion = question
            }
        }
    }

    // Same cache-first, fetch-fallback resolution as resolveCurrentQuestion,
    // for the 3 block-round candidates.
    private func resolveBlockCandidates() {
        blockCandidatesTask?.cancel()
        guard let room else {
            blockCandidates = []
            return
        }
        let ids = room.blockCandidateIds ?? []
        guard !ids.isEmpty else {
            blockCandidates = []
            return
        }
        let cached = ids.compactMap { questionCache[$0] }
        if cached.count == ids.count {
            blockCandidates = cached
            return
        }
        blockCandidatesTask = Task { [weak self] in
            guard let self else { return }
            let meta = QuestionMeta(roundLabel: "Solo Round", timeLimitSeconds: 15, pointsMultiplier: 1)
            guard let fetched = try? await QuestionService.fetchQuestions(ids: ids, meta: meta) else { return }
            guard !Task.isCancelled else { return }
            for question in fetched { self.questionCache[question.id] = question }
            if self.room?.blockCandidateIds == ids {
                self.blockCandidates = ids.compactMap { self.questionCache[$0] }
            }
        }
    }

    // Guarded on status so a stale timer (e.g. left running from a prior
    // countdown) can't fire a redundant status write.
    private func handleCountdownFinished() async {
        guard let room, room.status == .countdown else { return }
        do {
            try await RoomService.updateRoom(roomId: room.id, patch: StatusPatch(status: .question))
        } catch {
            lastError = error.localizedDescription
        }
    }

    // Same-room rematch: keeps the room code, resets only still-active
    // players' scores, clears answer history, and sends the room back to
    // "lobby". Every question this game touched (main + block
    // candidates) gets folded into asked_question_ids so the next Start
    // Game steers away from repeats.
    func handlePlayAgain() async {
        guard let room else { return }
        lastRoundResult = nil
        answersRealtime.clearLocal()

        let askedThisGame = (room.questionIds ?? []) + (room.blockCandidateIds ?? [])
        let askedSoFar = Array(Set(room.askedQuestionIds).union(askedThisGame))

        do {
            async let resetScores: () = RoomService.resetActivePlayerScores(roomId: room.id)
            async let clearAnswers: () = RoomService.clearRoomAnswers(roomId: room.id)
            _ = try await (resetScores, clearAnswers)
            try await RoomService.updateRoom(roomId: room.id, patch: PlayAgainPatch(askedQuestionIds: askedSoFar))
        } catch {
            lastError = error.localizedDescription
        }
    }

    // Ends this room for good and hands the app to a brand-new room/code
    // — the old room is left exactly as it is (still "end", never
    // deleted). Existing phones on the old room are not notified — a
    // known limitation carried over from the web app, not something to
    // fix here.
    func handleCancelGame() async {
        guard room != nil else { return }
        lastRoundResult = nil
        questionCache.removeAll()
        do {
            let newRoom = try await RoomService.createRoom(hostId: hostId)
            try await roomRealtime.start(roomId: newRoom.id)
            try await answersRealtime.start(roomId: newRoom.id)
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
