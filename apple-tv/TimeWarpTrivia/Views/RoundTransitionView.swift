import SwiftUI

// Direct port of components/tv/RoundTransitionScreen.tsx.
struct RoundTransitionView: View {
    @EnvironmentObject private var flow: GameFlowViewModel
    let result: RoundResult

    @State private var taunt: String?

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
            .background(TWTColor.void)
            .onAppear {
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
        .background(TWTColor.voidRaised)
        .overlay(RoundedRectangle(cornerRadius: TWTRadius.md).strokeBorder(TWTColor.teal, lineWidth: twtBorderWidth))
        .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
    }

    private var resultsGrid: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 160), spacing: TWTSpacing.md)], spacing: TWTSpacing.md) {
            ForEach(result.results) { pointResult in
                if let player = flow.players.first(where: { $0.id == pointResult.playerId }) {
                    VStack(spacing: TWTSpacing.xs) {
                        PlayerAvatarView(player: player, size: .sm)
                        Text(player.name)
                            .font(TWTFont.body(15))
                            .foregroundStyle(TWTColor.textHi)
                        Text(pointResult.pointsGained > 0 ? "+\(pointResult.pointsGained)" : "+0")
                            .font(TWTFont.monoBold(22))
                            .foregroundStyle(pointResult.pointsGained > 0 ? TWTColor.teal : TWTColor.textLo)
                    }
                    .padding(TWTSpacing.sm)
                    .background(TWTColor.voidRaised)
                    .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
                    .overlay(
                        RoundedRectangle(cornerRadius: TWTRadius.md)
                            .strokeBorder(pointResult.correct ? TWTColor.teal : Color.clear, lineWidth: twtBorderWidth)
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
                    .font(TWTFont.body(17))
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
                    .foregroundStyle(TWTColor.marigold)
            }
        }
    }
}
