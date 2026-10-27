import SwiftUI

// Named focus targets for LobbyView's two widely-separated focusable
// regions (the decade-pill sidebar, top-right; the footer, bottom).
// tvOS's automatic geometric focus engine turned out to be unreliable
// across that gap in BOTH directions depending on configuration —
// .focusSection() on both regions fixed sidebar-\>footer but broke
// footer-\>sidebar (and no .focusSection() was the exact reverse) — so
// rather than keep chasing the automatic engine, .onMoveCommand on each
// region explicitly redirects focus via this enum when the engine hits
// a dead end. Same technique PassiveAdvanceContainer already uses
// elsewhere in this app.
enum LobbyFocusTarget: Hashable {
    case decade(DecadeId)
    case help
    case musicToggle
    case startGame
}

// Direct port of components/tv/LobbyScreen.tsx (decade mode — Deep Cuts'
// DeepCutsLobbyScreen equivalent is deferred, see the plan).
struct LobbyView: View {
    @Environment(\.twtAccent) private var accent
    @EnvironmentObject private var flow: GameFlowViewModel
    @State private var showHelp = false
    // nil until the first onChange fires, so the room's starting headcount
    // (e.g. reopening a lobby already at 3) doesn't itself sound like a
    // join — mirrors the web's prevActiveCountRef starting at null.
    @State private var previousActiveCount: Int?
    @FocusState private var focusedControl: LobbyFocusTarget?
    // Local, not derived from MusicPlayer.shared directly — it isn't an
    // ObservableObject, so this view needs its own @State to redraw the
    // button label when it's pressed.
    @State private var musicEnabled = MusicPlayer.shared.isEnabled

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
                    .foregroundStyle(accent)
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
                            // Each new player pops into the room.
                            .transition(.scale(scale: 0.2).combined(with: .opacity))
                    }
                }
                .animation(.spring(response: 0.45, dampingFraction: 0.55), value: flow.players.map(\.id))
            }
        }
        // No .frame(maxWidth: .infinity) here — on tvOS a "greedy"
        // maxWidth-.infinity frame on this view broke the focus engine's
        // directional navigation into `sidebar` (its HStack sibling below),
        // even though nothing visually overlapped: DecadeFilterPillsView's
        // buttons became permanently unreachable by remote/D-pad, focus
        // stuck on the footer's Help button with nowhere else to go.
        // Confirmed by bisection — removing just this modifier restored
        // navigation with no other change. LazyVGrid's own .adaptive
        // columns already claim the width they're proposed, so dropping
        // this doesn't change the empty/populated layout either way.
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: TWTSpacing.md) {
            Text("DECADE FILTER")
                .font(TWTFont.body(13))
                .foregroundStyle(TWTColor.textLo)
            DecadeFilterPillsView(
                decades: flow.decades + [allDecadesOption],
                selectedId: flow.room?.decadeFilter ?? .all,
                onSelect: flow.selectDecade,
                focusedControl: $focusedControl
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
                .focused($focusedControl, equals: .help)
            Button(musicEnabled ? "🎵 Music: On" : "🎵 Music: Off") {
                musicEnabled.toggle()
                MusicPlayer.shared.isEnabled = musicEnabled
            }
            .font(TWTFont.body(15))
            .focused($focusedControl, equals: .musicToggle)
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
            // Mirrors startButton's &:disabled rule in
            // LobbyScreen.module.scss (opacity: 0.4) — without this a
            // disabled Start Game looks fully active and reads as a bug
            // (nothing on screen shows it can't be pressed).
            .opacity(flow.canStartGame && !flow.isStartingGame ? 1 : 0.4)
            .focused($focusedControl, equals: .startGame)
        }
        .onMoveCommand { direction in
            // Fires only when the engine finds no natural next
            // focusable item in that direction — see
            // PassiveAdvanceContainer's identical use of this fallback
            // semantics.
            guard direction == .up else { return }
            focusedControl = .decade(flow.room?.decadeFilter ?? .all)
        }
    }
}
