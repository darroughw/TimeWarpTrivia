import SwiftUI

// Direct port of components/tv/LobbyScreen.tsx (decade mode — Deep Cuts'
// DeepCutsLobbyScreen equivalent is deferred, see the plan). Help button/
// modal and the "join" sound-on-increase land in Phase 4.
struct LobbyView: View {
    @EnvironmentObject private var flow: GameFlowViewModel

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
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: TWTSpacing.sm) {
                Text("TIMEWARP TRIVIA")
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(TWTColor.marigold)
                Text("Grab your phone & join in")
                    .font(.largeTitle.bold())
                    .foregroundStyle(TWTColor.textHi)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: TWTSpacing.xs) {
                Text("ROOM CODE")
                    .font(.caption)
                    .foregroundStyle(TWTColor.textLo)
                Text(flow.room?.code ?? "----")
                    .font(.system(.largeTitle, design: .monospaced).bold())
                    .foregroundStyle(TWTColor.marigold)
                Text("Join at timewarptrivia.com/play")
                    .font(.caption)
                    .foregroundStyle(TWTColor.textLo)
            }
        }
    }

    private var playersPanel: some View {
        VStack(alignment: .leading, spacing: TWTSpacing.md) {
            Text("PLAYERS IN THE ROOM")
                .font(.caption)
                .foregroundStyle(TWTColor.textLo)
            if flow.players.isEmpty {
                Text("Waiting for the first player to join…")
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
                .font(.caption)
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
                .foregroundStyle(TWTColor.textLo)
            Spacer()
            if activeCount < 2 {
                Text("Need 2 players to start")
                    .foregroundStyle(TWTColor.textLo)
            }
            Button {
                Task { await flow.handleStartGame() }
            } label: {
                Text("Start Game")
                    .font(.headline)
                    .padding(.horizontal, TWTSpacing.xl)
                    .padding(.vertical, TWTSpacing.sm)
            }
            .tint(TWTColor.marigold)
            .disabled(!flow.canStartGame || flow.isStartingGame)
        }
    }
}
