import SwiftUI

// Direct port of components/tv/DecadeFilter.tsx: a radio-group row of
// decade-colored pills.
struct DecadeFilterPillsView: View {
    let decades: [Decade]
    let selectedId: DecadeId
    let onSelect: (DecadeId) -> Void
    var focusedControl: FocusState<LobbyFocusTarget?>.Binding

    var body: some View {
        HStack(spacing: TWTSpacing.sm) {
            ForEach(decades) { decade in
                DecadePillButton(
                    decade: decade,
                    selected: decade.id == selectedId,
                    // Passed in directly rather than read via
                    // @Environment(\.isFocused) inside DecadePillButton —
                    // this row's focus is also driven externally by
                    // focusedControl (for the cross-section .onMoveCommand
                    // redirect below), and mixing that with the
                    // environment's own implicit focus tracking left
                    // @Environment(\.isFocused) never actually flipping
                    // true for the focused pill (confirmed: its
                    // focus-only styling never appeared, even once
                    // navigation itself worked correctly). Comparing
                    // focusedControl's own value directly is the same
                    // source of truth navigation already uses, so it
                    // can't desync from it.
                    isFocused: focusedControl.wrappedValue == .decade(decade.id),
                    onSelect: onSelect
                )
                .focused(focusedControl, equals: .decade(decade.id))
            }
        }
        .onMoveCommand { direction in
            // Note: this fires on every move while a pill is focused, not
            // only when the focus engine is stuck — it's safe to redirect
            // every "down" here only because the pills are a single row,
            // so down always means "leave the row". tvOS's automatic
            // geometric focus engine could not reliably bridge this row
            // and the footer far below it, so this pins "down" explicitly
            // (see LobbyView's matching .up handler on the footer).
            guard direction == .down else { return }
            focusedControl.wrappedValue = .help
        }
    }
}

// Its own view (rather than inline in the ForEach) purely for
// readability — see the isFocused comment above for why focus state is
// passed in rather than read locally.
//
// Must be a Button, not a plain .focusable() + .onTapGesture view — a
// plain .focusable() view didn't reliably register as a D-pad/remote
// focus target at all (arrow-key navigation stopped reaching this row
// entirely). NeonButtonStyle, being a custom ButtonStyle rather than
// .plain, also avoids tvOS's own white focus "lift" halo, which .plain
// adds and tvOS 16 has no public API to remove.
private struct DecadePillButton: View {
    let decade: Decade
    let selected: Bool
    let isFocused: Bool
    let onSelect: (DecadeId) -> Void

    var body: some View {
        Button {
            // Only on an actual change — clicking the already-selected
            // pill again shouldn't re-trigger the "you just picked this"
            // sting.
            if !selected, let sting = decade.id.stingSound {
                SoundPlayer.shared.play(sting)
            }
            onSelect(decade.id)
        } label: {
            Text(decade.label)
                .font(TWTFont.bodyBold(16))
                // Never wrap mid-label ("200 / 0s") — all seven pills
                // fit on one row at TV type size with this padding.
                .lineLimit(1)
                .fixedSize()
        }
        .buttonStyle(
            NeonButtonStyle(
                color: TWTColor.decadeAccent(for: decade.id),
                size: .compact,
                isSelected: selected,
                isFocused: isFocused
            )
        )
    }
}
