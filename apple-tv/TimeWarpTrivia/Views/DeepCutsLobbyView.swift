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

// Port of components/tv/DeepCutsLobbyScreen.tsx: the lobby with topic
// cards instead of decade pills. Shown by RootView whenever the room has
// a Deep Cuts topic; "Decades" in the footer clears the topic, which
// switches back to LobbyView.
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
            playersPanel
            topicsGrid
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
                Text("DEEP CUTS")
                    .font(TWTFont.headline(24))
                    .foregroundStyle(accent)
                Text("Pick a topic & grab your phone")
                    .font(TWTFont.headline(40))
                    .foregroundStyle(TWTColor.textHi)
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

    private var playersPanel: some View {
        VStack(alignment: .leading, spacing: TWTSpacing.sm) {
            Text("PLAYERS IN THE ROOM")
                .font(TWTFont.body(13))
                .foregroundStyle(TWTColor.textLo)
            if flow.players.isEmpty {
                Text("Waiting for the first player to join…")
                    .font(TWTFont.body(17))
                    .foregroundStyle(TWTColor.textLo)
            } else {
                HStack(spacing: TWTSpacing.md) {
                    ForEach(flow.players) { player in
                        PlayerAvatarView(player: player, size: .sm, showName: true)
                            .opacity(player.status == .active ? 1 : 0.4)
                            .transition(.scale(scale: 0.2).combined(with: .opacity))
                    }
                }
                .animation(.spring(response: 0.45, dampingFraction: 0.55), value: flow.players.map(\.id))
            }
        }
    }

    private var topicsGrid: some View {
        // Extra room above the cards — a focused card scales up into it.
        VStack(alignment: .leading, spacing: TWTSpacing.md) {
            Text("TOPIC")
                .font(TWTFont.body(13))
                .foregroundStyle(TWTColor.textLo)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 300), spacing: TWTSpacing.md)], spacing: TWTSpacing.md) {
                ForEach(flow.deepCutTopics) { topic in
                    DeepCutTopicCard(
                        topic: topic,
                        isSelected: selectedTopicId == topic.id,
                        isFocused: focusedControl == .topic(topic.id),
                        onSelect: { flow.selectDeepCutTopic(topic.id) }
                    )
                    .focused($focusedControl, equals: .topic(topic.id))
                }
            }
        }
        .onMoveCommand { direction in
            // Fires only when the engine finds nothing below on its own.
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
                .font(TWTFont.body(15))
                .focused($focusedControl, equals: .help)
            Button(musicEnabled ? "🎵 Music: On" : "🎵 Music: Off") {
                musicEnabled.toggle()
                flow.setMusicEnabled(musicEnabled)
            }
            .font(TWTFont.body(15))
            .focused($focusedControl, equals: .musicToggle)
            Button("📅 Decades") { flow.clearDeepCutTopic() }
                .font(TWTFont.body(15))
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
                    .font(TWTFont.bodyBold(22))
                    .padding(.horizontal, TWTSpacing.xl)
                    .padding(.vertical, TWTSpacing.sm)
            }
            .buttonStyle(TWTPrimaryButtonStyle())
            .disabled(!flow.canStartGame || flow.isStartingGame)
            .opacity(flow.canStartGame && !flow.isStartingGame ? 1 : 0.4)
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

// One topic card: the topic's own color when selected (matching the web's
// DeepCutTopicFilter), paper when focused — focus and selection stay
// visually distinct, same rule as the decade pills.
private struct DeepCutTopicCard: View {
    let topic: DeepCutTopic
    let isSelected: Bool
    let isFocused: Bool
    let onSelect: () -> Void

    private var topicColor: Color { TWTColor.deepCutAccent(for: topic.id) }

    private var background: Color {
        if isFocused { return TWTColor.paper }
        return isSelected ? topicColor : TWTColor.voidRaised
    }

    var body: some View {
        Button(action: onSelect) {
            Text(topic.label)
                .font(TWTFont.headline(20))
                .foregroundStyle(isFocused || isSelected ? TWTColor.ink : TWTColor.textHi)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(maxWidth: .infinity, minHeight: 120)
                .padding(TWTSpacing.md)
                .background(background)
                .clipShape(RoundedRectangle(cornerRadius: TWTRadius.md))
                .overlay(
                    RoundedRectangle(cornerRadius: TWTRadius.md)
                        .strokeBorder(isSelected ? topicColor : TWTColor.voidLine, lineWidth: twtBorderWidth)
                )
                .shadow(color: isSelected ? topicColor.opacity(0.5) : .clear, radius: 24)
                .scaleEffect(isFocused ? 1.05 : 1)
                .animation(.easeOut(duration: 0.15), value: isFocused)
        }
        .buttonStyle(.plain)
    }
}
