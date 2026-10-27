import SwiftUI

// Direct port of components/tv/BlockScreen.tsx. Purely a display — the
// lowest scorer makes this choice on their phone; the TV just shows the
// room who's choosing and what they're choosing from. Not
// PassiveAdvanceContainer-wrapped: this transition is realtime-driven
// (the chooser's phone sets blocker_player_id + status), not host-paced.
struct BlockView: View {
    @EnvironmentObject private var flow: GameFlowViewModel
    let candidates: [Question]

    private var chooser: Player? { flow.players.pickBlockChooser() }

    var body: some View {
        Group {
            // Only reachable if every player has been removed mid-game —
            // min 2 to start makes it vanishingly unlikely, but this
            // beats crashing on chooser.name.
            if let chooser {
                content(chooser: chooser)
            } else {
                LoadingStateView(message: "Waiting for a player…")
            }
        }
        .onAppear { SoundPlayer.shared.play(.block) }
    }

    private func content(chooser: Player) -> some View {
        VStack(alignment: .leading, spacing: TWTSpacing.lg) {
            VStack(alignment: .leading, spacing: TWTSpacing.xs) {
                Text("BEFORE THE FINAL ROUND")
                    .font(TWTFont.bodyBold(18))
                    .textCase(.uppercase)
                    .foregroundStyle(TWTColor.coral)
                // .title/.highlight (BlockScreen.module.scss): marquee-
                // heading with the chooser's name in coral. .foregroundStyle
                // on a Text segment being concatenated needs tvOS 17 —
                // .foregroundColor is the tvOS-16-safe equivalent here.
                (Text(chooser.name).foregroundColor(TWTColor.coral)
                    + Text(" is in last place and is picking one question to answer alone.")
                    .foregroundColor(TWTColor.textHi))
                    .font(TWTFont.headline(34))
            }

            HStack(alignment: .top, spacing: TWTSpacing.xl) {
                VStack(spacing: TWTSpacing.sm) {
                    Text("LAST PLACE")
                        .font(TWTFont.monoBold(13))
                        .textCase(.uppercase)
                        .foregroundStyle(TWTColor.coral)
                    PlayerAvatarView(player: chooser, size: .lg, showName: true, showScore: true)
                }

                VStack(alignment: .leading, spacing: TWTSpacing.md) {
                    ForEach(candidates) { candidate in
                        HStack(spacing: TWTSpacing.md) {
                            if let decadeId = candidate.decadeId {
                                Text(decadeId.rawValue)
                                    .font(TWTFont.monoBold(13))
                                    .textCase(.uppercase)
                                    .foregroundStyle(TWTColor.ink)
                                    .padding(.horizontal, TWTSpacing.xs)
                                    .padding(.vertical, 2)
                                    .background(TWTColor.decadeAccent(for: decadeId))
                                    .clipShape(Capsule())
                            }
                            Text(candidate.text)
                                .font(TWTFont.body(20))
                                .foregroundStyle(TWTColor.textHi)
                        }
                        .padding(TWTSpacing.md)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(TWTColor.voidRaised)
                        .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
                    }
                }
            }

            Spacer()

            Text("Whichever one they pick, only \(chooser.name) can answer it. Everyone else sits this one out. Correct and fast still scores full points.")
                .font(TWTFont.body(17))
                .foregroundStyle(TWTColor.textLo)
        }
        .padding(TWTSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}
