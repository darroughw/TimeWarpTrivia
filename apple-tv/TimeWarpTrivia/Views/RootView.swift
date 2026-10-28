import SwiftUI

// Top-level screen switch — the native equivalent of LiveTvFlow.tsx's
// status-switch JSX. `flow.room == nil` means bootstrap() hasn't run yet
// (equivalent to the web's "Creating room…" loading state, except here it
// covers the pre-Start-press moment too, since this app doesn't create a
// room until the player actually presses Start).
struct RootView: View {
    @EnvironmentObject private var flow: GameFlowViewModel

    private var decade: DecadeId? { flow.room?.decadeFilter }

    // A Deep Cuts game takes its topic's color; otherwise the decade's.
    private var accent: Color {
        if let topicId = flow.room?.deepCutTopicId {
            return TWTColor.deepCutAccent(for: topicId)
        }
        return TWTColor.decadeAccent(for: decade ?? .all)
    }

    // Changes on every status change, and when the lobby switches
    // between decade and Deep Cuts mode, so both crossfade.
    private var screenKey: String {
        "\(flow.room?.status.rawValue ?? "none")-\(flow.room?.deepCutTopicId != nil)"
    }

    var body: some View {
        ZStack {
            // Drawn once here, beneath every screen, so its drift carries
            // across screen changes instead of restarting on each one.
            TWTBackground(decade: decade)
            screen
                // Crossfade between screens rather than hard-cutting on
                // every Realtime status change.
                .transition(.opacity)
                .id(screenKey)
        }
        .animation(.easeInOut(duration: 0.4), value: screenKey)
        .environment(\.twtAccent, accent)
    }

    private var screen: some View {
        Group {
            if let room = flow.room {
                switch room.status {
                case .lobby:
                    // A room with a Deep Cuts topic is in Deep Cuts mode.
                    // Unlike the web (a separate /deepcuts route per TV
                    // session), the native app switches modes inside the
                    // lobby, and the room's topic is the source of truth.
                    if room.deepCutTopicId != nil {
                        DeepCutsLobbyView()
                    } else {
                        LobbyView()
                    }
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
            } else if flow.connectionFailed {
                OfflineErrorView()
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
