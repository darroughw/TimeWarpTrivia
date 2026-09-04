import SwiftUI

// Direct port of app/styles/_mixins.scss's scanline-overlay mixin: a
// static repeating-horizontal-line texture (blend-mode overlay) plus a
// slow marigold-tinted band sweeping down the screen on an 8s loop.
// Applied once, at RootView, rather than per-screen like the web's
// ScanlineOverlay component — same visual result, one fewer view in the
// hierarchy per screen. Purely decorative and non-interactive.
struct ScanlineOverlayView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var sweepOffset: CGFloat = 0

    private let bandHeight: CGFloat = 240

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Canvas { context, size in
                    var y: CGFloat = 0
                    while y < size.height {
                        let rect = CGRect(x: 0, y: y, width: size.width, height: 1)
                        context.fill(Path(rect), with: .color(.white.opacity(0.035)))
                        y += 3
                    }
                }
                .blendMode(.overlay)

                LinearGradient(
                    colors: [.clear, TWTColor.marigold.opacity(0.05), .clear],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: bandHeight)
                .offset(y: -bandHeight + sweepOffset)
                .onAppear {
                    guard !reduceMotion else { return }
                    withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
                        sweepOffset = geometry.size.height + bandHeight
                    }
                }
            }
        }
        .allowsHitTesting(false)
        .ignoresSafeArea()
    }
}
