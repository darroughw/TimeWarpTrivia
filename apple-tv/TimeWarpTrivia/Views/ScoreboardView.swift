import SwiftUI

// Direct port of components/tv/ScoreboardScreen.tsx. Remove-player
// controls (RemovePlayerButton's arm/confirm pattern) are deferred —
// same call as LobbyView's player grid for now.
struct ScoreboardView: View {
    @Environment(\.twtAccent) private var accent
    @EnvironmentObject private var flow: GameFlowViewModel
    let roundLabel: String

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false

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
                                // Rows slide in from the left, last place
                                // first, so the leader lands last.
                                .offset(x: shown ? 0 : -120)
                                .opacity(shown ? 1 : 0)
                                .animation(
                                    reduceMotion ? nil : .spring(response: 0.5, dampingFraction: 0.75)
                                        .delay(Double(ranked.count - index) * 0.12),
                                    value: shown
                                )
                        }
                    }
                }
            }
            .padding(TWTSpacing.xl)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .onAppear { shown = true }
        }
    }

    private func row(rank: Int, player: Player, isFirst: Bool) -> some View {
        HStack(spacing: TWTSpacing.md) {
            Text("\(rank)")
                .font(TWTFont.monoBold(24))
                .foregroundStyle(isFirst ? accent : TWTColor.textLo)
                .frame(width: 44, alignment: .leading)
            PlayerAvatarView(player: player, size: .sm)
            Text(player.name)
                .font(isFirst ? TWTFont.bodyBold(20) : TWTFont.body(20))
                .foregroundStyle(TWTColor.textHi)
            if isFirst {
                Text("👑")
                    .font(.system(size: 36))
            }
            Spacer()
            Text(player.score.formatted())
                .font(TWTFont.monoBold(24))
                .foregroundStyle(accent)
        }
        .padding(TWTSpacing.md)
        .background(isFirst ? accent.opacity(0.14) : .clear)
        .background(TWTColor.voidRaised)
        .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
        .shadow(color: isFirst ? accent.opacity(0.4) : .clear, radius: 24)
        .overlay(
            RoundedRectangle(cornerRadius: TWTRadius.md)
                .strokeBorder(isFirst ? accent : Color.clear, lineWidth: twtBorderWidth)
        )
        .opacity(player.status == .active ? 1 : 0.4)
    }
}
