import SwiftUI

// Direct port of components/tv/HelpModal.tsx's content (lib/helpContent.ts)
// — two step-tracks, Hosting and Playing & Answering. tvOS's Menu button
// dismisses a .fullScreenCover automatically, the native equivalent of
// the web version's Escape-key/backdrop dismiss; the visible Close
// button below covers Select-driven dismissal too.
private struct HelpStep {
    let icon: String
    let title: String
    let body: String
}

struct HelpModalView: View {
    @Environment(\.dismiss) private var dismiss

    private static let hostingSteps = [
        HelpStep(icon: "tv", title: "Open the shared screen",
                 body: "Pull up timewarptrivia.com on a TV, laptop, or monitor, whatever the whole room can see. You'll get a room code."),
        HelpStep(icon: "calendar", title: "Pick a decade",
                 body: "Filter to one decade (60s–2010s) or open it up to all six. You can change it right up until you start."),
        HelpStep(icon: "number", title: "Wait for players",
                 body: "Everyone else grabs their phone, enters the room code and a name, and shows up live in your player list."),
        HelpStep(icon: "play.fill", title: "Start the game",
                 body: "2 to 10 players. Once everyone's in, hit start. The shared screen runs the show from here."),
    ]

    private static let playingSteps = [
        HelpStep(icon: "iphone", title: "Join from your phone",
                 body: "No app, no download. Just the room code and your name. Your phone becomes your buzzer."),
        HelpStep(icon: "bolt.fill", title: "Answer fast, answer right",
                 body: "Every question's speed-scored: a correct answer is worth more the faster you lock it in. Wrong or no answer scores zero. No penalty beyond that."),
        HelpStep(icon: "eye.fill", title: "Watch for the twist",
                 body: "Before the final round, whoever's in last place picks one question to answer completely alone. Everyone else just watches."),
        HelpStep(icon: "trophy.fill", title: "Final round pays double",
                 body: "The last round is worth 2x points, anything can still happen. Ranked leaderboard and a podium once it's over."),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TWTSpacing.xl) {
                HStack {
                    Text("How to Play")
                        .font(TWTFont.headline(36))
                        .foregroundStyle(TWTColor.textHi)
                    Spacer()
                    Button("Close") { dismiss() }
                        .font(TWTFont.bodyBold(18))
                }
                track(title: "Hosting", steps: Self.hostingSteps)
                track(title: "Playing & Answering", steps: Self.playingSteps)
            }
            .padding(TWTSpacing.xl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TWTColor.void)
    }

    private func track(title: String, steps: [HelpStep]) -> some View {
        VStack(alignment: .leading, spacing: TWTSpacing.md) {
            Text(title.uppercased())
                .font(TWTFont.bodyBold(16))
                .foregroundStyle(TWTColor.marigold)
            ForEach(steps, id: \.title) { step in
                HStack(alignment: .top, spacing: TWTSpacing.md) {
                    Image(systemName: step.icon)
                        .font(.title2)
                        .foregroundStyle(TWTColor.marigold)
                        .frame(width: 36)
                    VStack(alignment: .leading, spacing: TWTSpacing.xs) {
                        Text(step.title)
                            .font(TWTFont.bodyBold(18))
                            .foregroundStyle(TWTColor.textHi)
                        Text(step.body)
                            .font(TWTFont.body(15))
                            .foregroundStyle(TWTColor.textLo)
                    }
                }
            }
        }
    }
}
