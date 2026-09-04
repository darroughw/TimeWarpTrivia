import SwiftUI

// Direct port of components/tv/PlayerAvatar.tsx: emoji in a colored ring.
// The emoji is player.avatar — the literal stored column — not derived;
// only the ring color comes from AvatarColor's name hash (not stored).
struct PlayerAvatarView: View {
    enum Size {
        case sm, md, lg

        var diameter: CGFloat {
            switch self {
            case .sm: return 56
            case .md: return 88
            case .lg: return 128
            }
        }

        var emojiSize: CGFloat {
            switch self {
            case .sm: return 24
            case .md: return 40
            case .lg: return 56
            }
        }
    }

    let player: Player
    var size: Size = .md
    var showName = false
    var showScore = false
    var rank: Int?
    // Swaps the player's own color ring for a gold medal ring, regardless
    // of that player's color — used for the game's actual winner
    // (EndGameView) so 1st place reads as "the winner" at a glance, not
    // just "however this player happens to be colored."
    var isWinner = false

    private var ringColor: Color {
        AvatarColor.color(forName: player.name)
    }

    var body: some View {
        VStack(spacing: TWTSpacing.xs) {
            if let rank {
                Text("#\(rank)")
                    .font(.caption2)
                    .foregroundStyle(TWTColor.textLo)
            }
            Text(player.avatar)
                .font(.system(size: size.emojiSize))
                .frame(width: size.diameter, height: size.diameter)
                .background(Circle().fill(TWTColor.voidRaised))
                .overlay(Circle().strokeBorder(isWinner ? TWTColor.marigold : ringColor, lineWidth: isWinner ? twtBorderWidth + 1 : twtBorderWidth))
            if showName {
                Text(player.name)
                    .font(.caption)
                    .foregroundStyle(TWTColor.textHi)
                    .lineLimit(1)
            }
            if showScore {
                Text("\(player.score.formatted()) pts")
                    .font(.caption2.monospaced())
                    .foregroundStyle(TWTColor.marigold)
            }
        }
    }
}
