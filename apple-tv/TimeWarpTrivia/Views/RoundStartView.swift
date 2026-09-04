import SwiftUI

// Direct port of components/tv/RoundStartScreen.tsx.
struct RoundStartView: View {
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
                .font(.title3)
                .foregroundStyle(TWTColor.textLo)
            Text(roundLabel)
                .font(.system(size: 56, weight: .black))
                .foregroundStyle(TWTColor.marigold)
            Text("\(secondsRemaining)")
                .font(.system(size: 120, weight: .bold, design: .monospaced))
                .foregroundStyle(TWTColor.textHi)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TWTColor.void)
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
