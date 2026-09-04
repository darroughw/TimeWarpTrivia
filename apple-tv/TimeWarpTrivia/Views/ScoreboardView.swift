import SwiftUI

// Direct port of components/tv/ScoreboardScreen.tsx. Remove-player
// controls (RemovePlayerButton's arm/confirm pattern) are deferred —
// same call as LobbyView's player grid for now.
struct ScoreboardView: View {
    @EnvironmentObject private var flow: GameFlowViewModel
    let roundLabel: String

    private var ranked: [Player] { flow.players.rankedByScore() }

    var body: some View {
        PassiveAdvanceContainer {
            VStack(alignment: .leading, spacing: TWTSpacing.lg) {
                VStack(alignment: .leading, spacing: TWTSpacing.xs) {
                    Text("STANDINGS AFTER \(roundLabel)")
                        .font(TWTFont.body(13))
                        .textCase(.uppercase)
                        .foregroundStyle(TWTColor.textLo)
                    Text("Scoreboard")
                        .font(TWTFont.headline(44))
                        .foregroundStyle(TWTColor.textHi)
                }
                ScrollView {
                    VStack(spacing: TWTSpacing.sm) {
                        ForEach(Array(ranked.enumerated()), id: \.element.id) { index, player in
                            row(rank: index + 1, player: player, isFirst: index == 0)
                        }
                    }
                }
            }
            .padding(TWTSpacing.xl)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(TWTColor.void)
        }
    }

    private func row(rank: Int, player: Player, isFirst: Bool) -> some View {
        HStack(spacing: TWTSpacing.md) {
            Text("\(rank)")
                .font(TWTFont.monoBold(24))
                .foregroundStyle(isFirst ? TWTColor.marigold : TWTColor.textLo)
                .frame(width: 44, alignment: .leading)
            PlayerAvatarView(player: player, size: .sm)
            Text(player.name)
                .font(TWTFont.body(20))
                .foregroundStyle(TWTColor.textHi)
            Spacer()
            Text(player.score.formatted())
                .font(TWTFont.monoBold(24))
                .foregroundStyle(TWTColor.marigold)
        }
        .padding(TWTSpacing.md)
        .background(TWTColor.voidRaised)
        .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
        .overlay(
            RoundedRectangle(cornerRadius: TWTRadius.md)
                .strokeBorder(isFirst ? TWTColor.marigold : Color.clear, lineWidth: twtBorderWidth)
        )
        .opacity(player.status == .active ? 1 : 0.4)
    }
}
