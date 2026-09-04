import SwiftUI

// Native equivalent of the old WebViewController.swift's offline/error
// screen (see git history — void background, marigold title, a single
// autofocused Retry button) for the one failure this app can actually
// hit at the same "can we even load" moment a WebView's main-frame
// failure represented: bootstrap() couldn't create a room at all.
struct OfflineErrorView: View {
    @EnvironmentObject private var flow: GameFlowViewModel
    @State private var isRetrying = false

    var body: some View {
        VStack(spacing: TWTSpacing.md) {
            Spacer()
            Text("Lost the signal")
                .font(TWTFont.headline(48))
                .foregroundStyle(TWTColor.marigold)
            Text("Couldn't reach TimeWarp Trivia. Check the connection and try again.")
                .font(TWTFont.body(22))
                .foregroundStyle(TWTColor.textHi)
                .opacity(0.8)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 700)
            Button {
                guard !isRetrying else { return }
                isRetrying = true
                Task {
                    await flow.bootstrap()
                    isRetrying = false
                }
            } label: {
                Text("Retry")
                    .font(TWTFont.bodyBold(20))
                    .padding(.horizontal, TWTSpacing.xl)
                    .padding(.vertical, TWTSpacing.sm)
            }
            .tint(TWTColor.marigold)
            .prefersDefaultFocus(true, in: namespace)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TWTColor.void)
    }

    @Namespace private var namespace
}
