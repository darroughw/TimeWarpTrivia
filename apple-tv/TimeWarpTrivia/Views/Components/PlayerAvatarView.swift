import SwiftUI

// Direct port of components/tv/PlayerAvatar.tsx: emoji in a colored ring,
// color deterministically derived from the player's name (AvatarColor),
// not stored.
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

    private var avatar: (emoji: String, color: Color) {
        AvatarColor.avatar(forName: player.name)
    }

    var body: some View {
        VStack(spacing: TWTSpacing.xs) {
            Text(avatar.emoji)
                .font(.system(size: size.emojiSize))
                .frame(width: size.diameter, height: size.diameter)
                .background(Circle().fill(TWTColor.voidRaised))
                .overlay(Circle().strokeBorder(avatar.color, lineWidth: twtBorderWidth))
            if showName {
                Text(player.name)
                    .font(.caption)
                    .foregroundStyle(TWTColor.textHi)
                    .lineLimit(1)
            }
        }
    }
}
