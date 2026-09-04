import SwiftUI

// tvOS-native equivalent of LiveTvFlow.tsx's global keydown listener
// (ArrowRight/Enter/Space -> handleAdvance) for the three passive screens
// (transition/scoreboard/soloTransition) — none of which have a visible
// focusable "continue" button on the web either, just a text hint
// (PassiveAdvanceHint). Combines an invisible, default-focused button
// (catches a bare Select click, since it's the only/default-focused
// element on these screens) with .onMoveCommand (catches a swipe-right
// regardless of where focus happens to be) — the pragmatic native
// equivalent of "any Select or right-swipe from anywhere advances."
struct PassiveAdvanceContainer<Content: View>: View {
    @EnvironmentObject private var flow: GameFlowViewModel
    @ViewBuilder let content: () -> Content

    @Namespace private var namespace

    var body: some View {
        ZStack(alignment: .bottom) {
            content()

            // Color.clear has no intrinsic size, so inside a ZStack whose
            // other child fills the screen, it expands to match — giving
            // this button full-screen bounds and, once focused (it's
            // .prefersDefaultFocus), a full-screen tvOS focus "lift"
            // effect (a system blur/highlight) instead of the invisible
            // catch-target it's meant to be. A small explicit frame keeps
            // the focus effect small and out of the way; it doesn't need
            // to be large — .onMoveCommand below independently catches a
            // swipe-right from anywhere, and .prefersDefaultFocus is what
            // makes a bare Select hit this even though it's tiny.
            Button(action: { flow.handleAdvance() }) {
                Color.clear
            }
            .buttonStyle(.plain)
            .frame(width: 1, height: 1)
            .opacity(0.01)
            .prefersDefaultFocus(true, in: namespace)

            Text("Press → or Select to continue")
                .font(.caption)
                .foregroundStyle(TWTColor.textLo)
                .padding(.bottom, TWTSpacing.md)
        }
        .focusScope(namespace)
        .onMoveCommand { direction in
            if direction == .right { flow.handleAdvance() }
        }
    }
}
