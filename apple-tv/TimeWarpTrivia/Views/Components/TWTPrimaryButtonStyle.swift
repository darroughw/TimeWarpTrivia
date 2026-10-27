import SwiftUI

// The main call-to-action button (Start, Start Game, Play Again): a solid
// accent pill with ink text that grows and glows when focused. Replaces
// `.tint(...)` on the system bordered style, which rendered the label in
// the tint color *on* a tint-colored platter — Start Game's label was
// invisible until focused — and swapped to a generic white platter on
// focus, losing the brand color right when the button matters most.
struct TWTPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        Label(configuration: configuration)
    }

    // isFocused is only readable from inside a View, not the style itself.
    private struct Label: View {
        let configuration: ButtonStyleConfiguration
        @Environment(\.isFocused) private var isFocused
        @Environment(\.twtAccent) private var accent

        var body: some View {
            configuration.label
                .foregroundStyle(TWTColor.ink)
                .background(Capsule().fill(accent))
                .overlay(Capsule().strokeBorder(TWTColor.textHi, lineWidth: isFocused ? TWTFocusRing.width : 0))
                .shadow(color: accent.opacity(isFocused ? 0.7 : 0.3), radius: isFocused ? 36 : 16)
                .scaleEffect(configuration.isPressed ? 1.02 : isFocused ? 1.1 : 1)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isFocused)
                .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
        }
    }
}
