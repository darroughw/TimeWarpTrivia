import SwiftUI

// Named focus targets for DeepCutsLobbyView — same reasoning as
// LobbyFocusTarget: .onMoveCommand redirects focus explicitly wherever
// tvOS's geometric focus engine can't find its own way between the topic
// grid and the footer.
enum DeepCutsLobbyFocusTarget: Hashable {
    case topic(String)
    case decades
    case help
    case musicToggle
    case startGame
}

// Port of components/tv/DeepCutsLobbyScreen.tsx, laid out exactly like
// LobbyView (players left, picker sidebar right, same footer) with the
// Deep Cuts logo and a topic picker in place of the decade filter. Shown
// by RootView whenever the room has a Deep Cuts topic; "Decades" in the
// footer clears the topic, which switches back to LobbyView.
struct DeepCutsLobbyView: View {
    @Environment(\.twtAccent) private var accent
    @EnvironmentObject private var flow: GameFlowViewModel
    @State private var showHelp = false
    // See LobbyView — nil until the first change, so the starting
    // headcount doesn't itself sound like a join.
    @State private var previousActiveCount: Int?
    @FocusState private var focusedControl: DeepCutsLobbyFocusTarget?
    @State private var musicEnabled = MusicPlayer.shared.isEnabled

    private var activeCount: Int { flow.activePlayerCount }
    private var selectedTopicId: String? { flow.room?.deepCutTopicId }

    var body: some View {
        VStack(alignment: .leading, spacing: TWTSpacing.lg) {
            header
            HStack(alignment: .top, spacing: TWTSpacing.xl) {
                playersPanel
                sidebar
            }
            Spacer()
            footer
        }
        .padding(TWTSpacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .onChange(of: activeCount) { newValue in
            if let previousActiveCount, newValue > previousActiveCount {
                SoundPlayer.shared.play(.join)
            }
            previousActiveCount = newValue
        }
        .fullScreenCover(isPresented: $showHelp) { HelpModalView() }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: TWTSpacing.sm) {
                // public/logo-deepcuts.svg, kept as vector in the asset
                // catalog (see DeepCutsLogo.imageset).
                Image("DeepCutsLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 96)
                    .accessibilityLabel("Deep Cuts Trivia")
                Text("Pick a topic & grab your phone")
                    .font(TWTFont.headline(40))
                    .foregroundStyle(TWTColor.textHi)
                    .neonGlow(accent, intensity: 0.5)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: TWTSpacing.xs) {
                Text("ROOM CODE")
                    .font(TWTFont.body(13))
                    .foregroundStyle(TWTColor.textLo)
                Text(flow.room?.code ?? "----")
                    .font(TWTFont.monoBold(48))
                    .foregroundStyle(accent)
                    .shadow(color: accent.opacity(0.7), radius: 20)
                    .padding(.horizontal, TWTSpacing.md)
                    .padding(.vertical, TWTSpacing.xs)
                    .background(RoundedRectangle(cornerRadius: TWTRadius.md).fill(accent.opacity(0.1)))
                    .overlay(RoundedRectangle(cornerRadius: TWTRadius.md).strokeBorder(accent.opacity(0.6), lineWidth: twtBorderWidth))
                Text("Join at timewarptrivia.com/play")
                    .font(TWTFont.body(13))
                    .foregroundStyle(TWTColor.textLo)
            }
        }
    }

    // Same as LobbyView's playersPanel — including deliberately no
    // .frame(maxWidth: .infinity) (see the comment there: it breaks focus
    // navigation into the sidebar).
    private var playersPanel: some View {
        VStack(alignment: .leading, spacing: TWTSpacing.md) {
            Text("PLAYERS IN THE ROOM")
                .font(TWTFont.body(13))
                .foregroundStyle(TWTColor.textLo)
            if flow.players.isEmpty {
                Text("Waiting for the first player to join…")
                    .font(TWTFont.body(17))
                    .foregroundStyle(TWTColor.textLo)
            } else {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: TWTSpacing.md)], spacing: TWTSpacing.md) {
                    ForEach(flow.players) { player in
                        PlayerAvatarView(player: player, size: .md, showName: true)
                            .opacity(player.status == .active ? 1 : 0.4)
                            .transition(.scale(scale: 0.2).combined(with: .opacity))
                    }
                }
                .animation(.spring(response: 0.45, dampingFraction: 0.55), value: flow.players.map(\.id))
            }
        }
    }

    // The decade sidebar's counterpart: topic pills, one per line since
    // topic names run much longer than "80s".
    private var sidebar: some View {
        VStack(alignment: .leading, spacing: TWTSpacing.md) {
            Text("TOPIC")
                .font(TWTFont.body(13))
                .foregroundStyle(TWTColor.textLo)
            VStack(alignment: .leading, spacing: TWTSpacing.sm) {
                ForEach(flow.deepCutTopics) { topic in
                    Button { flow.selectDeepCutTopic(topic.id) } label: {
                        Text(topic.label)
                            .font(TWTFont.bodyBold(16))
                            .lineLimit(1)
                            .fixedSize()
                    }
                    .buttonStyle(
                        NeonButtonStyle(
                            color: TWTColor.deepCutAccent(for: topic.id),
                            size: .compact,
                            isSelected: selectedTopicId == topic.id,
                            isFocused: focusedControl == .topic(topic.id)
                        )
                    )
                    .focused($focusedControl, equals: .topic(topic.id))
                }
            }
        }
        .onMoveCommand { direction in
            // Fires only when the engine finds nothing below on its own
            // (same fallback as DecadeFilterPillsView).
            guard direction == .down else { return }
            focusedControl = .help
        }
    }

    private var footer: some View {
        HStack {
            Text("\(activeCount) player\(activeCount == 1 ? "" : "s") joined")
                .font(TWTFont.body(17))
                .foregroundStyle(TWTColor.textLo)
            Button("Help") { showHelp = true }
                .font(TWTFont.bodyBold(15))
                .buttonStyle(NeonButtonStyle(color: TWTColor.neonMagenta, isFocused: focusedControl == .help))
                .focused($focusedControl, equals: .help)
            Button(musicEnabled ? "Music: On" : "Music: Off") {
                musicEnabled.toggle()
                flow.setMusicEnabled(musicEnabled)
            }
            .font(TWTFont.bodyBold(15))
            .buttonStyle(NeonButtonStyle(color: TWTColor.neonMagenta, isFocused: focusedControl == .musicToggle))
            .focused($focusedControl, equals: .musicToggle)
            Button("Decades") { flow.clearDeepCutTopic() }
                .font(TWTFont.bodyBold(15))
                .buttonStyle(NeonButtonStyle(color: TWTColor.neonMagenta, isFocused: focusedControl == .decades))
                .focused($focusedControl, equals: .decades)
            Spacer()
            if activeCount < 2 {
                Text("Need 2 players to start")
                    .font(TWTFont.body(17))
                    .foregroundStyle(TWTColor.textLo)
            }
            Button {
                Task { await flow.handleStartGame() }
            } label: {
                Text("Start Game")
                    .font(TWTFont.headline(20))
                    .textCase(.uppercase)
            }
            .buttonStyle(NeonButtonStyle(size: .large, isFocused: focusedControl == .startGame))
            .disabled(!flow.canStartGame || flow.isStartingGame)
            .focused($focusedControl, equals: .startGame)
        }
        .onMoveCommand { direction in
            guard direction == .up else { return }
            if let topicId = selectedTopicId ?? flow.deepCutTopics.first?.id {
                focusedControl = .topic(topicId)
            }
        }
    }
}
