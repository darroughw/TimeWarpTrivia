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
    @State private var floating = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: TWTSpacing.lg) {
            Spacer()
            ZStack {
                RetroSunView()
                    .frame(width: 520, height: 520)
                    .offset(y: 60)
                ChromeText(text: "TIMEWARP TRIVIA", font: TWTFont.title(72))
                    .offset(y: floating ? -8 : 8)
                    .animation(reduceMotion ? nil : .easeInOut(duration: 2.4).repeatForever(autoreverses: true), value: floating)
            }
            Text("Six decades of pop culture trivia on the big screen — everyone else's phone is the buzzer.")
                .font(TWTFont.body(28))
                .foregroundStyle(TWTColor.textHi)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 900)
            Button {
                guard !isStarting else { return }
                isStarting = true
                Task { await flow.bootstrap() }
            } label: {
                Text("Start")
                    .font(TWTFont.headline(24))
                    .textCase(.uppercase)
            }
            .buttonStyle(NeonButtonStyle(size: .large))
            .prefersDefaultFocus(true, in: namespace)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onAppear { floating = true }
    }

    @Namespace private var namespace
}

// Synthwave sunset disc: a marigold-to-coral gradient sliced by
// horizontal gaps that widen toward the horizon — same motif as the
// phone Join screen.
private struct RetroSunView: View {
    // (top, bottom) of each visible band, as fractions of the disc height.
    private static let bands: [(CGFloat, CGFloat)] = [(0, 0.52), (0.56, 0.64), (0.69, 0.76), (0.82, 0.88)]

    var body: some View {
        GeometryReader { geometry in
            let size = geometry.size
            Circle()
                .fill(LinearGradient(colors: [TWTColor.marigold, TWTColor.coral], startPoint: .top, endPoint: .bottom))
                .mask(
                    ZStack(alignment: .top) {
                        ForEach(Array(Self.bands.enumerated()), id: \.offset) { _, band in
                            Rectangle()
                                .frame(height: (band.1 - band.0) * size.height)
                                .offset(y: band.0 * size.height)
                        }
                    }
                    .frame(width: size.width, height: size.height, alignment: .top)
                )
                .opacity(0.45)
                .shadow(color: TWTColor.coral.opacity(0.4), radius: 60)
        }
        .accessibilityHidden(true)
    }
}
