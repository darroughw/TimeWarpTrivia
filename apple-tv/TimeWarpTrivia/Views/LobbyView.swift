import SwiftUI

// Direct port of components/tv/LobbyScreen.tsx (decade mode — Deep Cuts'
// DeepCutsLobbyScreen equivalent is deferred, see the plan).
struct LobbyView: View {
    @EnvironmentObject private var flow: GameFlowViewModel
    @State private var showHelp = false
    // nil until the first onChange fires, so the room's starting headcount
    // (e.g. reopening a lobby already at 3) doesn't itself sound like a
    // join — mirrors the web's prevActiveCountRef starting at null.
    @State private var previousActiveCount: Int?

    private var activeCount: Int { flow.activePlayerCount }

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
        .background(TWTColor.void)
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
                Text("TIMEWARP TRIVIA")
                    .font(TWTFont.headline(24))
                    .foregroundStyle(TWTColor.marigold)
                Text("Grab your phone & join in")
                    .font(TWTFont.headline(40))
                    .foregroundStyle(TWTColor.textHi)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: TWTSpacing.xs) {
                Text("ROOM CODE")
                    .font(TWTFont.body(13))
                    .foregroundStyle(TWTColor.textLo)
                Text(flow.room?.code ?? "----")
                    .font(TWTFont.monoBold(40))
                    .foregroundStyle(TWTColor.marigold)
                Text("Join at timewarptrivia.com/play")
                    .font(TWTFont.body(13))
                    .foregroundStyle(TWTColor.textLo)
            }
        }
    }

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
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 110), spacing: TWTSpacing.md)], spacing: TWTSpacing.md) {
                    ForEach(flow.players) { player in
                        PlayerAvatarView(player: player, size: .md, showName: true)
                            .opacity(player.status == .active ? 1 : 0.4)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: TWTSpacing.md) {
            Text("DECADE FILTER")
                .font(TWTFont.body(13))
                .foregroundStyle(TWTColor.textLo)
            DecadeFilterPillsView(
                decades: flow.decades + [allDecadesOption],
                selectedId: flow.room?.decadeFilter ?? .all,
                onSelect: flow.selectDecade
            )
        }
    }

    private var footer: some View {
        HStack {
            Text("\(activeCount) player\(activeCount == 1 ? "" : "s") joined")
                .font(TWTFont.body(17))
                .foregroundStyle(TWTColor.textLo)
            Button("Help") { showHelp = true }
                .font(TWTFont.body(15))
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
            .tint(TWTColor.marigold)
            .disabled(!flow.canStartGame || flow.isStartingGame)
        }
    }
}
