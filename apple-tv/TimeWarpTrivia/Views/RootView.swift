import SwiftUI

// Top-level screen switch — the native equivalent of LiveTvFlow.tsx's
// status-switch JSX. `flow.room == nil` means bootstrap() hasn't run yet
// (equivalent to the web's "Creating room…" loading state, except here it
// covers the pre-Start-press moment too, since this app doesn't create a
// room until the player actually presses Start).
struct RootView: View {
    @EnvironmentObject private var flow: GameFlowViewModel

    var body: some View {
        Group {
            if let room = flow.room {
                switch room.status {
                case .lobby:
                    LobbyView()
                case .countdown:
                    if let question = flow.currentQuestion {
                        RoundStartView(roundLabel: question.roundLabel, secondsRemaining: flow.countdownSecondsRemaining)
                    } else {
                        LoadingStateView(message: "Loading question…")
                    }
                case .question, .soloQuestion:
                    if let question = flow.currentQuestion {
                        QuestionView(question: question, soloPlayer: room.status == .soloQuestion ? flow.soloPlayer : nil)
                            .id(question.id)
                    } else {
                        LoadingStateView(message: "Loading question…")
                    }
                case .transition, .soloTransition:
                    if let result = flow.lastRoundResult {
                        RoundTransitionView(result: result)
                    } else {
                        LoadingStateView(message: "Tallying scores…")
                    }
                case .scoreboard:
                    ScoreboardView(roundLabel: flow.currentQuestion?.roundLabel ?? "")
                case .block:
                    if flow.blockCandidates.isEmpty {
                        LoadingStateView(message: "Picking questions…")
                    } else {
                        BlockView(candidates: flow.blockCandidates)
                    }
                case .end:
                    EndGameView()
                }
            } else {
                IntroView()
            }
        }
        .alert(
            "Something went wrong",
            isPresented: Binding(get: { flow.lastError != nil }, set: { if !$0 { flow.lastError = nil } })
        ) {
            Button("OK") { flow.lastError = nil }
        } message: {
            Text(flow.lastError ?? "")
        }
    }
}
