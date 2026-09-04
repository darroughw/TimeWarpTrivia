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
                default:
                    // Rounds/scoreboard/block/end screens land in Phases
                    // 2-3 — see the plan file.
                    Text(room.status.rawValue)
                        .foregroundStyle(TWTColor.textHi)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(TWTColor.void)
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
