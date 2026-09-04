import SwiftUI

// Direct port of components/tv/TvIntroScreen.tsx — deliberately barer
// than the marketing landing page: no join link, no decade strip, a TV
// remote's first input should be one predictable Select press away.
// Unlike the web version (which routes /tv -> /host on Start), this app
// bootstraps its one and only room the moment Start is pressed — there's
// no separate "TV wrapper vs. game" URL split to mirror natively.
struct IntroView: View {
    @EnvironmentObject private var flow: GameFlowViewModel
    @State private var isStarting = false

    var body: some View {
        VStack(spacing: TWTSpacing.lg) {
            Spacer()
            Text("TIMEWARP TRIVIA")
                .font(.system(size: 64, weight: .black))
                .foregroundStyle(TWTColor.marigold)
            Text("Six decades of pop culture trivia on the big screen — everyone else's phone is the buzzer.")
                .font(.title3)
                .foregroundStyle(TWTColor.textHi)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 900)
            Button {
                guard !isStarting else { return }
                isStarting = true
                Task { await flow.bootstrap() }
            } label: {
                Text("Start")
                    .font(.headline)
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
