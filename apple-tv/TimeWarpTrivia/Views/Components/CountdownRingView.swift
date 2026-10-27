import SwiftUI

// Direct port of components/tv/CountdownRing.tsx: an SVG ring there,
// a .trim()-based Shape here. aria-hidden equivalent — deliberately not
// an accessibility live region (would spam VoiceOver every second for
// the whole question); QuestionView posts a single low-time announcement
// instead, same as the web version.
struct CountdownRingView: View {
    @Environment(\.twtAccent) private var accent
    let totalSeconds: Int
    let secondsRemaining: Int
    var pointsMultiplier: Int = 1

    private var clamped: Int { max(0, min(secondsRemaining, totalSeconds)) }
    private var ratio: Double { totalSeconds > 0 ? Double(clamped) / Double(totalSeconds) : 0 }
    private var urgent: Bool { clamped <= 5 }
    private var points: Int { Scoring.pointsRemaining(secondsRemaining: clamped, timeLimitSeconds: totalSeconds, multiplier: pointsMultiplier) }

    var body: some View {
        VStack(spacing: TWTSpacing.xs) {
            ZStack {
                Circle()
                    .stroke(TWTColor.voidLine, lineWidth: 12)
                Circle()
                    .trim(from: 0, to: ratio)
                    .stroke(
                        urgent ? TWTColor.coral : accent,
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .shadow(color: (urgent ? TWTColor.coral : accent).opacity(0.6), radius: 12)
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 1), value: ratio)
                VStack(spacing: 0) {
                    Text("\(clamped)")
                        .font(TWTFont.monoBold(40))
                        .foregroundStyle(urgent ? TWTColor.coral : TWTColor.textHi)
                    Text("SEC")
                        .font(TWTFont.body(11))
                        .foregroundStyle(TWTColor.textLo)
                }
            }
            .frame(width: 180, height: 180)
            // A heartbeat thump on every tick of the last 5 seconds.
            .scaleEffect(urgent && clamped > 0 && clamped % 2 == 1 ? 1.1 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.5), value: clamped)
            Text("\(points) pts")
                .font(TWTFont.monoBold(16))
                .foregroundStyle(accent)
        }
    }
}
