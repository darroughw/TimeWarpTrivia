import Foundation

// What comes next from a "passive" stage — one the host advances manually
// with Select/swipe-right — given the room's current status and
// question_index. Direct port of app/_game/LiveTvFlow.tsx's
// nextPassiveStep/labelForStep; "what's next" depends on *where in the
// question sequence* the room is, not just its status.
struct RoundStep: Equatable {
    let status: RoomStatus
    var questionIndex: Int?
}

enum RoundStepLogic {
    static func nextPassiveStep(from status: RoomStatus, questionIndex: Int?) -> RoundStep? {
        switch status {
        case .transition:
            guard let questionIndex else { return nil }
            if questionIndex == totalMainQuestions - 1 { return RoundStep(status: .end) } // last question of round 3
            if questionIndex % questionsPerRound == questionsPerRound - 1 {
                return RoundStep(status: .scoreboard) // last of round 1 or 2
            }
            return RoundStep(status: .question, questionIndex: questionIndex + 1)

        case .scoreboard:
            guard let questionIndex else { return nil }
            let justFinishedRound = questionIndex / questionsPerRound + 1
            if justFinishedRound == 1 {
                return RoundStep(status: .countdown, questionIndex: questionsPerRound)
            }
            if justFinishedRound == 2 {
                return RoundStep(status: .block) // block happens once, right before round 3
            }
            return nil

        case .soloTransition:
            // Round 3 / final starts here, after a beat to let everyone regroup.
            return RoundStep(status: .countdown, questionIndex: questionsPerRound * 2)

        default:
            return nil
        }
    }

    static func label(for step: RoundStep?) -> String {
        guard let step else { return "" }
        switch step.status {
        case .question, .countdown:
            let round = (step.questionIndex ?? 0) / questionsPerRound + 1
            return round == 3 ? "Final Round" : "Round \(round)"
        case .scoreboard:
            return "Scoreboard"
        case .block:
            return "Block Round"
        case .end:
            return "Final Results"
        default:
            return ""
        }
    }

    // Stages the host paces manually with Select/swipe-right. "block" is
    // deliberately absent — that transition is triggered externally, by
    // whichever phone is the lowest scorer picking their solo question.
    static let passiveStatuses: Set<RoomStatus> = [.transition, .scoreboard, .soloTransition]
}
