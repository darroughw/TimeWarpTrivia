import SwiftUI

// Shared native port of the arm-then-confirm pattern used by both
// components/tv/CancelGameButton.tsx and RemovePlayerButton.tsx: two
// presses on the same button — first arms a 3s confirm window (label
// swaps to "Confirm?"), second within that window actually fires
// `onConfirm`. Auto-disarms on timeout or on losing focus (important
// for D-pad/remote users who navigate away mid-confirm, so a stray
// later press elsewhere can't land on a stale armed state) — the web
// version's onBlur, done here via @FocusState.
struct ArmConfirmButtonView: View {
    let label: String
    var armedLabel = "Confirm?"
    let onConfirm: () -> Void

    @State private var armed = false
    @State private var disarmTask: Task<Void, Never>?
    @FocusState private var isFocused: Bool

    private static let confirmWindow: UInt64 = 3_000_000_000

    var body: some View {
        Button(action: handleTap) {
            Text(armed ? armedLabel : label)
                .font(TWTFont.bodyBold(14))
                .textCase(.uppercase)
        }
        .focused($isFocused)
        .onChange(of: isFocused) { focused in
            if !focused { disarm() }
        }
        .onDisappear { disarmTask?.cancel() }
    }

    private func handleTap() {
        if armed {
            disarm()
            onConfirm()
            return
        }
        armed = true
        disarmTask?.cancel()
        disarmTask = Task {
            try? await Task.sleep(nanoseconds: Self.confirmWindow)
            if !Task.isCancelled { armed = false }
        }
    }

    private func disarm() {
        disarmTask?.cancel()
        armed = false
    }
}
