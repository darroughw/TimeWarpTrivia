import SwiftUI

// Direct port of components/tv/EndGameScreen.tsx.
struct EndGameView: View {
    @EnvironmentObject private var flow: GameFlowViewModel

    @State private var smackTalk: String?

    private var ranked: [Player] { flow.players.rankedByScore() }
    private var podium: [Player] { Array(ranked.prefix(3)) }
    private var rest: [Player] { Array(ranked.dropFirst(3)) }

    var body: some View {
        VStack(spacing: TWTSpacing.lg) {
            VStack(spacing: TWTSpacing.xs) {
                Text("GAME OVER")
                    .font(.caption)
                    .foregroundStyle(TWTColor.textLo)
                Text("Final Results")
                    .font(.system(size: 48, weight: .black))
                    .foregroundStyle(TWTColor.marigold)
            }

            podiumView

            if !rest.isEmpty {
                VStack(spacing: TWTSpacing.xs) {
                    ForEach(Array(rest.enumerated()), id: \.element.id) { index, player in
                        HStack {
                            Text("#\(index + 4)  \(player.name)")
                                .foregroundStyle(TWTColor.textHi)
                            Spacer()
                            Text(player.score.formatted())
                                .font(.system(.body, design: .monospaced))
                                .foregroundStyle(TWTColor.textLo)
                        }
                        .padding(.horizontal, TWTSpacing.md)
                    }
                }
                .frame(maxWidth: 600)
            }

            Spacer()

            VStack(spacing: TWTSpacing.md) {
                if let smackTalk {
                    Text(smackTalk)
                        .font(.callout)
                        .foregroundStyle(TWTColor.coral)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 800)
                }
                HStack(spacing: TWTSpacing.md) {
                    Button(action: { Task { await flow.handlePlayAgain() } }) {
                        Text("Play Again")
                            .font(.headline)
                            .padding(.horizontal, TWTSpacing.xl)
                            .padding(.vertical, TWTSpacing.sm)
                    }
                    .tint(TWTColor.marigold)

                    ArmConfirmButtonView(label: "Cancel Game") {
                        Task { await flow.handleCancelGame() }
                    }
                }
            }
        }
        .padding(TWTSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TWTColor.void)
        .onAppear {
            smackTalk = Taunts.pickEndGameLine(players: flow.players)
            SoundPlayer.shared.play(.fanfare)
        }
    }

    private var podiumView: some View {
        HStack(alignment: .bottom, spacing: TWTSpacing.lg) {
            if podium.count > 1 { podiumSpot(player: podium[1], place: 2, height: 90) }
            if podium.count > 0 { podiumSpot(player: podium[0], place: 1, height: 130) }
            if podium.count > 2 { podiumSpot(player: podium[2], place: 3, height: 60) }
        }
    }

    private func podiumSpot(player: Player, place: Int, height: CGFloat) -> some View {
        VStack(spacing: TWTSpacing.sm) {
            PlayerAvatarView(player: player, size: .lg, showScore: true, isWinner: place == 1)
            RoundedRectangle(cornerRadius: TWTRadius.sm)
                .fill(TWTColor.voidRaised)
                .frame(width: 120, height: height)
                .overlay(
                    Text("\(place)")
                        .font(.system(.title, design: .monospaced).bold())
                        .foregroundStyle(place == 1 ? TWTColor.marigold : TWTColor.textLo)
                )
        }
    }
}
