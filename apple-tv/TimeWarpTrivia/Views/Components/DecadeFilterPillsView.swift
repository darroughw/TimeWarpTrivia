import SwiftUI

// Direct port of components/tv/DecadeFilter.tsx: a radio-group row of
// decade-colored pills.
struct DecadeFilterPillsView: View {
    let decades: [Decade]
    let selectedId: DecadeId
    let onSelect: (DecadeId) -> Void

    var body: some View {
        HStack(spacing: TWTSpacing.sm) {
            ForEach(decades) { decade in
                let selected = decade.id == selectedId
                Button {
                    // Only on an actual change — clicking the
                    // already-selected pill again shouldn't re-trigger
                    // the "you just picked this" sting.
                    if !selected, let sting = decade.id.stingSound {
                        SoundPlayer.shared.play(sting)
                    }
                    onSelect(decade.id)
                } label: {
                    Text(decade.label)
                        .font(TWTFont.bodyBold(18))
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
