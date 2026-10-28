import Foundation

// Either a decade-mode or Deep Cuts content source — exactly one of the
// two ever applies to a given room, mirroring questions_exactly_one_source
// at the schema level. Mirrors lib/questionService.ts's QuestionSource.
enum QuestionSource {
    case decade(DecadeId)
    case deepCutTopic(String)
}

// Direct port of lib/questionService.ts.
enum QuestionService {
    // Which stage-context (roundLabel/timeLimitSeconds/pointsMultiplier) a
    // given question id represents for this room. Keyed off the room's own
    // fields rather than room.status — question_ids and block_candidate_ids
    // are both set once at Start Game and don't change again for the life
    // of the room.
    static func questionMeta(room: Room, questionId: String) -> QuestionMeta {
        if let blockCandidateIds = room.blockCandidateIds, blockCandidateIds.contains(questionId) {
            return QuestionMeta(roundLabel: "Solo Round", timeLimitSeconds: 15, pointsMultiplier: 1)
        }
        let idx = room.questionIds?.firstIndex(of: questionId)
        let round = idx.map { $0 / 5 + 1 } ?? 1
        let isFinal = round == 3
        return QuestionMeta(
            roundLabel: isFinal ? "Final Round" : "Round \(round)",
            timeLimitSeconds: isFinal ? 15 : 20,
            pointsMultiplier: isFinal ? 2 : 1
        )
    }

    static func fetchQuestion(id: String, meta: QuestionMeta) async throws -> Question? {
        let row: QuestionRow? = try await SupabaseService.client
            .from("questions")
            .select()
            .eq("id", value: id)
            .maybeSingle()
            .execute()
            .value
        return row.map { Question(row: $0, meta: meta) }
    }

    // Preserves the caller's id order (e.g. block_candidate_ids order)
    // rather than whatever order Postgres happens to return rows in.
    static func fetchQuestions(ids: [String], meta: QuestionMeta) async throws -> [Question] {
        guard !ids.isEmpty else { return [] }
        let rows: [QuestionRow] = try await SupabaseService.client
            .from("questions")
            .select()
            .in("id", values: ids)
            .execute()
            .value
        let byId = Dictionary(uniqueKeysWithValues: rows.map { ($0.id.uuidString.lowercased(), $0) })
        return ids.compactMap { byId[$0] }.map { Question(row: $0, meta: meta) }
    }

    // Picks `count` distinct random active questions from one source.
    // Fetches the whole matching pool and shuffles client-side — at
    // ~1,400 total rows this is a single fast round trip; see
    // lib/questionService.ts's fetchRandomQuestionSet doc comment for why
    // this doesn't scale past ~10x current volume.
    //
    // `excludeIds` steers a rematch away from questions already asked in
    // this room. If excluding them would leave too few to fill `count`,
    // exclusion is dropped entirely for this call rather than partially
    // applied — repeats only when the pool is truly exhausted.
    static func fetchRandomQuestionSet(
        source: QuestionSource,
        count: Int,
        excludeIds: [String] = []
    ) async throws -> [QuestionRow] {
        var query = SupabaseService.client.from("questions").select().eq("is_active", value: true)
        switch source {
        case .deepCutTopic(let topicId):
            query = query.eq("deep_cut_topic_id", value: topicId)
        case .decade(let decadeId):
            if decadeId != .all {
                query = query.eq("decade_id", value: decadeId.rawValue)
            }
        }
        let rows: [QuestionRow] = try await query.execute().value

        let excludeSet = Set(excludeIds)
        let fresh = rows.filter { !excludeSet.contains($0.id.uuidString.lowercased()) }
        let pool = fresh.count >= count ? fresh : rows
        guard pool.count >= count else {
            throw QuestionServiceError.notEnoughQuestions(have: pool.count, need: count)
        }
        return Array(pool.shuffled().prefix(count))
    }

    static func fetchDecades() async throws -> [Decade] {
        let rows: [DecadeRow] = try await SupabaseService.client
            .from("decades")
            .select("id, label")
            .eq("is_active", value: true)
            .order("sort_order", ascending: true)
            .execute()
            .value
        return rows.map { Decade(id: $0.id, label: $0.label) }
    }

    // Direct port of lib/questionService.ts's fetchDeepCutTopics.
    static func fetchDeepCutTopics() async throws -> [DeepCutTopic] {
        try await SupabaseService.client
            .from("deep_cut_topics")
            .select("id, label")
            .eq("is_active", value: true)
            .order("sort_order", ascending: true)
            .execute()
            .value
    }
}

enum QuestionServiceError: Error, LocalizedError {
    case notEnoughQuestions(have: Int, need: Int)

    var errorDescription: String? {
        switch self {
        case .notEnoughQuestions(let have, let need):
            return "Not enough active questions (have \(have), need \(need))."
        }
    }
}
