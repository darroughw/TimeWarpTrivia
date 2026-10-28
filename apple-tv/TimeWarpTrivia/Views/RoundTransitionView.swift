import SwiftUI

// Direct port of components/tv/RoundTransitionScreen.tsx.
struct RoundTransitionView: View {
    @Environment(\.twtAccent) private var accent
    @EnvironmentObject private var flow: GameFlowViewModel
    let result: RoundResult

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var taunt: String?
    @State private var revealed = false

    var body: some View {
        PassiveAdvanceContainer {
            VStack(spacing: TWTSpacing.lg) {
                Text("CORRECT ANSWER")
                    .font(TWTFont.body(13))
                    .foregroundStyle(TWTColor.textLo)
                answerCard
                resultsGrid
                Spacer()
                tauntBanner
                Spacer()
                footer
            }
            .padding(TWTSpacing.xl)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .onAppear {
                revealed = true
                taunt = Taunts.pickTaunt(players: flow.players)
                let everyoneWrong = !result.results.isEmpty && result.results.allSatisfy { !$0.correct }
                if everyoneWrong { SoundPlayer.shared.play(.trombone) }
            }
        }
    }

    private var answerCard: some View {
        HStack(spacing: TWTSpacing.md) {
            Text(OptionLetter.all[result.question.correctIndex])
                .font(TWTFont.monoBold(28))
                .foregroundStyle(TWTColor.ink)
                .frame(width: 56, height: 56)
                .background(Circle().fill(TWTColor.teal))
            // .answerText (app/styles/_mixins.scss): marquee-heading, same
            // Archivo Black treatment as every other title on this screen.
            // .textCase(.uppercase), not a manual .uppercased() on the
            // string, mirrors CSS text-transform: uppercase — visual only,
            // doesn't touch the underlying string VoiceOver reads.
            Text(result.question.options[result.question.correctIndex])
                .font(TWTFont.headline(28))
                .textCase(.uppercase)
                .foregroundStyle(TWTColor.paper)
        }
        .padding(TWTSpacing.md)
        .neonPanel(TWTColor.teal, lineWidth: 3, glow: 0.7)
        // The answer slams in first...
        .scaleEffect(revealed ? 1 : 0.6)
        .opacity(revealed ? 1 : 0)
        .animation(reduceMotion ? nil : .spring(response: 0.45, dampingFraction: 0.6), value: revealed)
    }

    private var resultsGrid: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 200), spacing: TWTSpacing.md)], spacing: TWTSpacing.md) {
            ForEach(Array(result.results.enumerated()), id: \.element.id) { index, pointResult in
                if let player = flow.players.first(where: { $0.id == pointResult.playerId }) {
                    VStack(spacing: TWTSpacing.xs) {
                        PlayerAvatarView(player: player, size: .md)
                        Text(player.name)
                            .font(TWTFont.body(15))
                            .foregroundStyle(TWTColor.textHi)
                        Text(pointResult.pointsGained > 0 ? "+\(pointResult.pointsGained)" : "+0")
                            .font(TWTFont.monoBold(22))
                            .foregroundStyle(pointResult.pointsGained > 0 ? TWTColor.teal : TWTColor.textLo)
                    }
                    .frame(minWidth: 180)
                    .padding(TWTSpacing.sm)
                    .neonPanel(
                        pointResult.correct ? TWTColor.teal : TWTColor.textLo.opacity(0.3),
                        lineWidth: pointResult.correct ? 3 : 2,
                        glow: pointResult.correct ? 0.55 : 0
                    )
                    // ...then each player's card pops in, one after another.
                    .scaleEffect(revealed ? 1 : 0.3)
                    .opacity(revealed ? (pointResult.correct ? 1 : 0.7) : 0)
                    .animation(
                        reduceMotion ? nil : .spring(response: 0.4, dampingFraction: 0.55).delay(0.45 + Double(index) * 0.12),
                        value: revealed
                    )
                }
            }
        }
        // Re-keyed per question so SwiftUI treats each question's cards as
        // fresh identities — matches the web's per-question React key,
        // which exists so the reveal animation replays every question.
        .id(result.question.id)
    }

    // The between-question taunt — the room's running joke, so it gets
    // the screen's centerpiece rather than a footnote (it used to sit
    // small in the bottom-left corner and players missed it). Lands last,
    // after every player's result card has popped in.
    @ViewBuilder private var tauntBanner: some View {
        if let taunt {
            Text(taunt)
                .font(TWTFont.headline(34))
                .foregroundStyle(TWTColor.textHi)
                .multilineTextAlignment(.center)
                .lineSpacing(6)
                .neonGlow(TWTColor.coral, intensity: 0.6)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, TWTSpacing.xl)
                .padding(.vertical, TWTSpacing.lg)
                .frame(maxWidth: 1500)
                .neonPanel(TWTColor.coral, cornerRadius: TWTRadius.lg, lineWidth: 3, glow: 0.6)
                .scaleEffect(revealed ? 1 : 0.7)
                .opacity(revealed ? 1 : 0)
                .animation(
                    reduceMotion ? nil : .spring(response: 0.5, dampingFraction: 0.6).delay(0.6 + Double(result.results.count) * 0.12),
                    value: revealed
                )
        }
    }

    private var footer: some View {
        HStack {
            Spacer()
            VStack(alignment: .trailing) {
                Text("UP NEXT")
                    .font(TWTFont.body(11))
                    .foregroundStyle(TWTColor.textLo)
                // .nextRound (app/styles/_mixins.scss): marquee-heading.
                Text(result.nextRoundLabel)
                    .font(TWTFont.headline(22))
                    .textCase(.uppercase)
                    .foregroundStyle(accent)
            }
        }
    }
}
