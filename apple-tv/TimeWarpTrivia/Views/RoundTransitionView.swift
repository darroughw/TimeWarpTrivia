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
        .background(TWTColor.teal.opacity(0.12))
        .background(TWTColor.voidRaised)
        .overlay(RoundedRectangle(cornerRadius: TWTRadius.md).strokeBorder(TWTColor.teal, lineWidth: twtBorderWidth))
        .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
        .shadow(color: TWTColor.teal.opacity(0.45), radius: 32)
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
                    .background(TWTColor.voidRaised)
                    .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
                    .overlay(
                        RoundedRectangle(cornerRadius: TWTRadius.md)
                            .strokeBorder(pointResult.correct ? TWTColor.teal : Color.clear, lineWidth: twtBorderWidth)
                    )
                    .shadow(color: pointResult.correct ? TWTColor.teal.opacity(0.35) : .clear, radius: 18)
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

    private var footer: some View {
        HStack {
            if let taunt {
                Text(taunt)
                    .font(TWTFont.bodyBold(20))
                    .foregroundStyle(TWTColor.coral)
                    .frame(maxWidth: 600, alignment: .leading)
            } else {
                Spacer()
            }
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
