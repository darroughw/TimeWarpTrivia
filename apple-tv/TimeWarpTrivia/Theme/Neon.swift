import SwiftUI

// The synthwave "neon" look shared by every screen: one button style, one
// panel treatment, and two text treatments (neon glow, chrome).

extension TWTColor {
    // Secondary neon for utility buttons (Help, Music, mode switch) so
    // they read as a set apart from the accent-colored primary action.
    // Not teal — teal means "correct" everywhere in the game.
    static let neonMagenta = Color(hex: 0xFF4FD8)
}

// Every button in the app. At rest: a dark pill with a glowing outline
// and glowing label in its color. Focused: it fills with that color, the
// label flips to ink, and the glow intensifies. Selected (radio-style
// pills/cards): a tinted fill with a solid outline — clearly different
// from focused, so "where the remote is" and "what's chosen" never blur.
//
// A custom ButtonStyle (rather than .plain plus styling on top) is what
// keeps tvOS's own white focus "lift" halo from appearing — that halo
// comes with the system styles and can't be switched off on tvOS 16.
struct NeonButtonStyle: ButtonStyle {
    enum Size {
        case compact, regular, large

        var padding: EdgeInsets {
            switch self {
            case .compact: return EdgeInsets(top: 12, leading: 18, bottom: 12, trailing: 18)
            case .regular: return EdgeInsets(top: 14, leading: 30, bottom: 14, trailing: 30)
            case .large: return EdgeInsets(top: 18, leading: 64, bottom: 18, trailing: 64)
            }
        }
    }

    // nil uses the session accent (decade/topic color).
    var color: Color?
    var size: Size = .regular
    var isSelected = false
    // Pass this whenever the button's focus is also steered by a
    // @FocusState binding: @Environment(\.isFocused) was found not to
    // flip for buttons whose focus is driven that way (see
    // DecadeFilterPillsView). nil reads the environment.
    var isFocused: Bool?
    // nil gives a pill.
    var cornerRadius: CGFloat?

    func makeBody(configuration: Configuration) -> some View {
        NeonButtonBody(configuration: configuration, style: self)
    }
}

private struct NeonButtonBody: View {
    let configuration: ButtonStyleConfiguration
    let style: NeonButtonStyle

    @Environment(\.isFocused) private var environmentFocused
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.twtAccent) private var accent

    private var focused: Bool { style.isFocused ?? environmentFocused }
    private var tint: Color { style.color ?? accent }
    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: style.cornerRadius ?? 999, style: .continuous)
    }

    private var fill: Color {
        if focused { return tint }
        return style.isSelected ? tint.opacity(0.25) : TWTColor.void.opacity(0.6)
    }

    private var labelColor: Color {
        if focused { return TWTColor.ink }
        return style.isSelected ? TWTColor.textHi : tint
    }

    var body: some View {
        configuration.label
            .foregroundStyle(labelColor)
            // Neon-tube glow on the label itself while unfocused.
            .shadow(color: focused ? .clear : tint.opacity(0.8), radius: 8)
            .padding(style.size.padding)
            .background(shape.fill(fill))
            .overlay(
                shape.strokeBorder(
                    focused ? Color.white.opacity(0.85) : tint.opacity(style.isSelected ? 1 : 0.75),
                    lineWidth: focused || style.isSelected || style.size == .large ? 3 : 2
                )
            )
            .shadow(color: tint.opacity(focused ? 0.9 : 0.4), radius: focused ? 16 : 8)
            .shadow(color: tint.opacity(focused ? 0.55 : 0), radius: 44)
            .scaleEffect(configuration.isPressed ? 0.96 : focused ? 1.08 : 1)
            .opacity(isEnabled ? 1 : 0.35)
            .animation(.spring(response: 0.28, dampingFraction: 0.62), value: focused)
            .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
    }
}

extension View {
    // A dark glass panel with a glowing neon outline — the container look
    // for answer cards, scoreboard rows, result cards, and the like.
    func neonPanel(
        _ color: Color,
        cornerRadius: CGFloat = TWTRadius.md,
        lineWidth: CGFloat = 2,
        glow: Double = 0.45
    ) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        return background(shape.fill(TWTColor.void.opacity(0.7)))
            .overlay(shape.strokeBorder(color, lineWidth: lineWidth))
            .shadow(color: color.opacity(glow), radius: 14)
    }

    // Light-on-color neon sign glow for headings.
    func neonGlow(_ color: Color, intensity: Double = 1) -> some View {
        shadow(color: color.opacity(0.9 * intensity), radius: 2)
            .shadow(color: color.opacity(0.7 * intensity), radius: 12)
            .shadow(color: color.opacity(0.45 * intensity), radius: 32)
    }
}

// The 80s chrome-lettering treatment for marquee titles: bright sky on
// top, a hard horizon line, then the accent color fading down — with a
// neon glow around it.
struct ChromeText: View {
    let text: String
    let font: Font
    var color: Color = TWTColor.marigold

    var body: some View {
        Text(text)
            .font(font)
            .foregroundStyle(
                LinearGradient(
                    stops: [
                        .init(color: .white, location: 0),
                        .init(color: Color(hex: 0xBFE9FF), location: 0.48),
                        .init(color: Color(hex: 0x2A1B4D), location: 0.5),
                        .init(color: color, location: 0.56),
                        .init(color: Color(hex: 0xFFE7B0), location: 1),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .neonGlow(color, intensity: 0.7)
    }
}
