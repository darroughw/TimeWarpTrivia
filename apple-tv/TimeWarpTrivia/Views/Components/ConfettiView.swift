import SwiftUI

// One burst of falling confetti in the A/B/C/D answer colors, for big
// moments (the final results). Plain views with a single animation each —
// no per-frame drawing — and nothing at all under Reduce Motion.
struct ConfettiView: View {
    var pieceCount = 60

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var falling = false

    var body: some View {
        GeometryReader { geometry in
            if !reduceMotion {
                ForEach(0..<pieceCount, id: \.self) { index in
                    // Deterministic spread rather than random, so a
                    // re-render mid-fall doesn't reshuffle every piece.
                    let x = CGFloat((index * 37) % 100) / 100 * geometry.size.width
                    let duration = 2.6 + Double(index % 7) * 0.35
                    let delay = Double(index % 10) * 0.12
                    let spin = Double((index % 2 == 0 ? 1 : -1) * (360 + index * 25))
                    RoundedRectangle(cornerRadius: 3)
                        .fill(TWTColor.options[index % TWTColor.options.count])
                        .frame(width: 14, height: 22)
                        .rotationEffect(.degrees(falling ? spin : 0))
                        .position(x: x + (falling ? CGFloat(index % 5 - 2) * 40 : 0), y: falling ? geometry.size.height + 40 : -40)
                        .opacity(falling ? 0.9 : 1)
                        .animation(.easeIn(duration: duration).delay(delay), value: falling)
                }
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear { falling = true }
    }
}
