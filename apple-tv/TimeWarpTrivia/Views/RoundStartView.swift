import SwiftUI

// Direct port of components/tv/RoundStartScreen.tsx.
struct RoundStartView: View {
    @Environment(\.twtAccent) private var accent
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let roundLabel: String
    let secondsRemaining: Int

    // One deadpan line per countdown, picked once per screen appearance
    // rather than per-render.
    private static let readyLines = [
        "Try to keep up.",
        "Same rules, higher stakes.",
        "No pressure. Okay, some pressure.",
        "Everyone already forgot everything.",
        "Here we go again.",
    ]

    // "Same rules, higher stakes" implies a previous round to raise the
    // stakes from — nonsensical on Round 1's countdown.
    private static let firstRoundReadyLines = readyLines.filter { $0 != "Same rules, higher stakes." }

    @State private var readyLine = ""

    var body: some View {
        VStack(spacing: TWTSpacing.md) {
            Spacer()
            Text(readyLine)
                .font(TWTFont.body(24))
                .foregroundStyle(TWTColor.textLo)
            ChromeText(text: roundLabel.uppercased(), font: TWTFont.title(64), color: accent)
            ZStack {
                // A ring that bursts outward on every tick — re-created per
                // second via .id so its appear animation replays.
                if !reduceMotion {
                    TickBurstView(color: accent)
                        .id(secondsRemaining)
                }
                Circle()
                    .fill(accent.opacity(0.15))
                    .overlay(Circle().strokeBorder(accent, lineWidth: 6))
                    .frame(width: 260, height: 260)
                    .shadow(color: accent.opacity(0.5), radius: 40)
                // Each new number punches in big and settles.
                Text("\(secondsRemaining)")
                    .font(TWTFont.monoBold(120))
                    .foregroundStyle(TWTColor.textHi)
                    .id(secondsRemaining)
                    .transition(reduceMotion ? .opacity : .scale(scale: 1.8).combined(with: .opacity))
            }
            .animation(.spring(response: 0.35, dampingFraction: 0.6), value: secondsRemaining)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onAppear {
            let pool = roundLabel == "Round 1" ? Self.firstRoundReadyLines : Self.readyLines
            readyLine = pool.randomElement() ?? ""
        }
        // Two-parameter onChange needs tvOS 17 — this target is tvOS 16,
        // so the older single-parameter form is what's available.
        .onChange(of: secondsRemaining) { newValue in
            // Fires right as the countdown hits 0 and the room's about to
            // swap to the question status — a beat before this screen
            // actually unmounts, since the status transition round-trips
            // through Realtime.
            if newValue == 0 { SoundPlayer.shared.play(.whoosh) }
        }
    }
}

private struct TickBurstView: View {
    let color: Color
    @State private var expanded = false

    var body: some View {
        Circle()
            .stroke(color, lineWidth: 6)
            .frame(width: 260, height: 260)
            .scaleEffect(expanded ? 1.7 : 1)
            .opacity(expanded ? 0 : 0.8)
            .onAppear {
                withAnimation(.easeOut(duration: 0.9)) { expanded = true }
            }
    }
}
