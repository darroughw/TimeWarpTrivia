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
            // Fires only when the engine finds no natural next focusable
            // item in that direction (see LobbyView's matching .up
            // handler on the footer, and PassiveAdvanceContainer's
            // original use of this same fallback semantics) — tvOS's
            // automatic geometric focus engine could not reliably bridge
            // this row and the footer far below it in both directions at
            // once, so this pins the "down" side explicitly.
            guard direction == .down else { return }
            focusedControl.wrappedValue = .help
        }
    }
}

// Its own view (rather than inline in the ForEach) purely for
// readability — see the isFocused comment above for why focus state is
// passed in rather than read locally.
//
// Must be a Button, not a plain .focusable() + .onTapGesture view —
// tried that specifically to dodge tvOS's built-in "lift card" focus
// chrome, but a plain .focusable() view didn't reliably register as a
// D-pad/remote focus target at all (confirmed: arrow-key navigation
// stopped reaching this row entirely). So this keeps .buttonStyle(.plain)
// and layers styling on top to match DecadeFilter.module.scss's
// dpad-focusable pill design as closely as tvOS's own focus chrome
// allows: dim border/text at rest, a solid fill + dark text swap on
// focus (matching how the plain default-styled Help/Start Game buttons
// already show focus), decade accent color reserved for the selected
// state. The platform's own oversized focus-lift card behind a Button's
// content isn't suppressible via public API on this deployment target
// (tvOS 16) — confirmed .focusEffectDisabled() (tvOS 17+) has no effect
// on it — so some system chrome bleed-through is an accepted platform
// constraint here, not a bug to keep chasing.
private struct DecadePillButton: View {
    let decade: Decade
    let selected: Bool
    let isFocused: Bool
    let onSelect: (DecadeId) -> Void

    private var shape: some InsettableShape { RoundedRectangle(cornerRadius: TWTRadius.lg, style: .continuous) }

    private var borderColor: Color {
        selected ? TWTColor.decadeAccent(for: decade.id) : TWTColor.voidLine
    }

    private var backgroundColor: Color {
        if isFocused { return TWTColor.paper }
        return selected ? TWTColor.decadeAccent(for: decade.id) : TWTColor.voidRaised
    }

    private var foregroundColor: Color {
        if isFocused { return TWTColor.ink }
        return selected ? TWTColor.ink : TWTColor.textLo
    }

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
                .padding(.horizontal, TWTSpacing.sm + (isFocused ? TWTSpacing.xs : 0))
                .padding(.vertical, TWTSpacing.sm + (isFocused ? TWTSpacing.xs : 0))
                .foregroundStyle(foregroundColor)
                .background(backgroundColor)
                .clipShape(shape)
                .overlay(shape.strokeBorder(borderColor, lineWidth: twtBorderWidth))
                .animation(.easeOut(duration: 0.15), value: isFocused)
        }
        .buttonStyle(.plain)
    }
}
