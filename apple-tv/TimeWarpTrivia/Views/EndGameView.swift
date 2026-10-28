import SwiftUI

// Direct port of components/tv/EndGameScreen.tsx.
struct EndGameView: View {
    @Environment(\.twtAccent) private var accent
    @EnvironmentObject private var flow: GameFlowViewModel

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var smackTalk: String?
    @State private var podiumRisen = false

    private var ranked: [Player] { flow.players.rankedByScore() }
    private var podium: [Player] { Array(ranked.prefix(3)) }
    private var rest: [Player] { Array(ranked.dropFirst(3)) }

    var body: some View {
        VStack(spacing: TWTSpacing.lg) {
            VStack(spacing: TWTSpacing.xs) {
                Text("GAME OVER")
                    .font(TWTFont.bodyBold(18))
                    .textCase(.uppercase)
                    .foregroundStyle(accent)
                ChromeText(text: "FINAL RESULTS", font: TWTFont.headline(52), color: accent)
            }

            podiumView

            if !rest.isEmpty {
                VStack(spacing: TWTSpacing.xs) {
                    ForEach(Array(rest.enumerated()), id: \.element.id) { index, player in
                        HStack {
                            (Text("#\(index + 4)  ").font(TWTFont.mono(16)).foregroundColor(TWTColor.textLo)
                                + Text(player.name).font(TWTFont.body(16)).foregroundColor(TWTColor.textHi))
                            Spacer()
                            Text(player.score.formatted())
                                .font(TWTFont.mono(16))
                                .foregroundStyle(TWTColor.teal)
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
                        .font(TWTFont.bodyBold(20))
                        .foregroundStyle(TWTColor.coral)
                        .multilineTextAlignment(.center)
                        // Never truncated — the podium's flexible
                        // spacing gives way first.
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: 1000)
                }
                HStack(spacing: TWTSpacing.md) {
                    Button(action: { Task { await flow.handlePlayAgain() } }) {
                        Text("Play Again")
                            .font(TWTFont.headline(22))
                            .textCase(.uppercase)
                    }
                    .buttonStyle(NeonButtonStyle(size: .large))

                    ArmConfirmButtonView(label: "Cancel Game") {
                        Task { await flow.handleCancelGame() }
                    }
                }
            }
        }
        .padding(TWTSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .overlay(ConfettiView())
        .onAppear {
            podiumRisen = true
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
        // 3rd rises first, the winner last — saves the reveal for the end.
        let delay = Double(3 - place) * 0.35
        let medalColor = [accent, TWTColor.paperDim, Color(hex: 0xCD7F32)][place - 1]
        return VStack(spacing: TWTSpacing.sm) {
            if place == 1 {
                Text("👑")
                    .font(.system(size: 48))
                    .offset(y: podiumRisen ? 0 : -400)
                    .animation(reduceMotion ? nil : .spring(response: 0.5, dampingFraction: 0.5).delay(delay + 0.5), value: podiumRisen)
            }
            PlayerAvatarView(player: player, size: .lg, showScore: true, isWinner: place == 1)
                .scaleEffect(podiumRisen ? 1 : 0.2)
                .opacity(podiumRisen ? 1 : 0)
                .animation(reduceMotion ? nil : .spring(response: 0.45, dampingFraction: 0.55).delay(delay + 0.3), value: podiumRisen)
            RoundedRectangle(cornerRadius: TWTRadius.sm)
                .fill(LinearGradient(colors: [medalColor.opacity(0.45), TWTColor.voidRaised], startPoint: .top, endPoint: .bottom))
                .overlay(RoundedRectangle(cornerRadius: TWTRadius.sm).strokeBorder(medalColor.opacity(0.7), lineWidth: twtBorderWidth))
                .frame(width: 160, height: podiumRisen ? height * 1.2 : 0)
                .animation(reduceMotion ? nil : .spring(response: 0.6, dampingFraction: 0.75).delay(delay), value: podiumRisen)
                .overlay(
                    Text("\(place)")
                        .font(TWTFont.monoBold(32))
                        .foregroundStyle(TWTColor.textHi)
                        .opacity(podiumRisen ? 1 : 0)
                )
        }
    }
}
