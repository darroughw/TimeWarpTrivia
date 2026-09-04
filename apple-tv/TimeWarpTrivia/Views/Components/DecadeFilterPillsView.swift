import SwiftUI

// Direct port of components/tv/DecadeFilter.tsx: a radio-group row of
// decade-colored pills. Sound (playDecadeSting on an actual change, never
// on re-selecting the already-selected pill) lands in Phase 4 alongside
// the rest of the sound system — see SoundPlayer.
struct DecadeFilterPillsView: View {
    let decades: [Decade]
    let selectedId: DecadeId
    let onSelect: (DecadeId) -> Void

    var body: some View {
        HStack(spacing: TWTSpacing.sm) {
            ForEach(decades) { decade in
                let selected = decade.id == selectedId
                Button {
                    onSelect(decade.id)
                } label: {
                    Text(decade.label)
                        .font(.headline)
                        .padding(.horizontal, TWTSpacing.md)
                        .padding(.vertical, TWTSpacing.xs)
                }
                .background(selected ? TWTColor.decadeAccent(for: decade.id) : TWTColor.voidRaised)
                .foregroundStyle(selected ? TWTColor.ink : TWTColor.textHi)
                .clipShape(Capsule())
                .overlay(
                    Capsule().strokeBorder(TWTColor.decadeAccent(for: decade.id), lineWidth: twtBorderWidth)
                )
            }
        }
        .focusSection()
    }
}
