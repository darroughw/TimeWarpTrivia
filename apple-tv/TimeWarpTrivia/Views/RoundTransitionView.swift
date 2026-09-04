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
                    .font(.caption)
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
                .font(.system(.title, design: .monospaced).bold())
                .foregroundStyle(TWTColor.ink)
                .frame(width: 56, height: 56)
                .background(Circle().fill(TWTColor.teal))
            Text(result.question.options[result.question.correctIndex])
                .font(.title2.bold())
                .foregroundStyle(TWTColor.ink)
        }
        .padding(TWTSpacing.md)
        .background(TWTColor.paper)
        .clipShape(RoundedRectangle(cornerRadius: TWTRadius.lg))
    }

    private var resultsGrid: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 160), spacing: TWTSpacing.md)], spacing: TWTSpacing.md) {
            ForEach(result.results) { pointResult in
                if let player = flow.players.first(where: { $0.id == pointResult.playerId }) {
                    VStack(spacing: TWTSpacing.xs) {
                        PlayerAvatarView(player: player, size: .sm)
                        Text(player.name)
                            .font(.caption)
                            .foregroundStyle(TWTColor.textHi)
                        Text(pointResult.pointsGained > 0 ? "+\(pointResult.pointsGained)" : "+0")
                            .font(.system(.title3, design: .monospaced).bold())
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
                    .font(.callout)
                    .foregroundStyle(TWTColor.coral)
                    .frame(maxWidth: 600, alignment: .leading)
            } else {
                Spacer()
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text("UP NEXT")
                    .font(.caption2)
                    .foregroundStyle(TWTColor.textLo)
                Text(result.nextRoundLabel)
                    .font(.title3.bold())
                    .foregroundStyle(TWTColor.marigold)
            }
        }
    }
}
