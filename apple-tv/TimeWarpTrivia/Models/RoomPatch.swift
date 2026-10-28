import Foundation

// Small, dedicated Encodable patches — one shape per RoomService.updateRoom
// call site in the original LiveTvFlow.tsx — rather than one loosely-typed
// partial-object type. Swift has no clean equivalent of JS's "omit vs.
// explicit null" distinction on a single generic patch type, so each call
// site gets its own self-documenting shape instead.
struct StartGamePatch: Encodable {
    let status = RoomStatus.countdown
    let questionIndex = 0
    let questionIds: [String]
    let currentQuestionId: String
    let blockCandidateIds: [String]
}

struct DecadeFilterPatch: Encodable {
    let decadeFilter: DecadeId
}

// Picking a topic also resets the decade filter, so a decade picked
// earlier in the same lobby doesn't keep theming the TV and phones
// during a Deep Cuts game.
struct DeepCutTopicPatch: Encodable {
    let deepCutTopicId: String
    let decadeFilter = DecadeId.all
}

// Back to decade mode. Hand-written encode because the synthesized one
// skips nil optionals entirely — it would send an empty patch instead of
// actually nulling the column.
struct ClearDeepCutTopicPatch: Encodable {
    private enum CodingKeys: String, CodingKey {
        case deepCutTopicId
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeNil(forKey: .deepCutTopicId)
    }
}

struct StatusPatch: Encodable {
    let status: RoomStatus
}

// handleAdvance's "question"/"countdown" branch — advances question_index
// and resolves current_question_id from the room's own question_ids at
// the same time, matching LiveTvFlow.tsx's handleAdvance exactly.
struct AdvanceToQuestionPatch: Encodable {
    let status: RoomStatus
    let questionIndex: Int
    let currentQuestionId: String
}

// Play Again (TIM-38): keeps the room code, resets to lobby with a fresh
// asked_question_ids so the next Start Game steers away from repeats.
struct PlayAgainPatch: Encodable {
    let status = RoomStatus.lobby
    let currentQuestionId: String? = nil
    let blockerPlayerId: String? = nil
    let questionIds: [String]? = nil
    let questionIndex: Int? = nil
    let blockCandidateIds: [String]? = nil
    let askedQuestionIds: [String]
    // Exactly one of these is actually meaningful per room mode (decade vs.
    // Deep Cuts) — both are always sent since `updateRoom` just patches
    // whichever columns are present, mirroring LiveTvFlow.tsx's own
    // mode-conditional spread.
    let decadeFilter: DecadeId = .all
    let deepCutTopicId: String? = nil
}
