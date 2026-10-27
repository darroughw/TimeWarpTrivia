import SwiftUI

extension Color {
    // SwiftUI has no built-in hex initializer.
    init(hex: UInt32) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// Mirrors app/styles/_theme.scss's "broadcast void" palette exactly —
// see that file for the design rationale behind each token (why coral/
// teal are fixed rather than decade-themeable, why the focus ring is
// deliberately not marigold, etc).
enum TWTColor {
    static let void = Color(hex: 0x0B0E1A)
    static let voidRaised = Color(hex: 0x131829)
    static let voidLine = Color(hex: 0x262C46)

    static let paper = Color(hex: 0xF4ECD8)
    static let paperDim = Color(hex: 0xE4D9BD)
    static let ink = Color(hex: 0x171425)

    static let marigold = Color(hex: 0xFFB238)
    static let marigoldDim = Color(hex: 0x8A5F18)
    static let coral = Color(hex: 0xFF5A5F)
    static let teal = Color(hex: 0x2DD4BF)

    static let textHi = Color(hex: 0xFBF6EC)
    static let textLo = Color(hex: 0xA7ABC4)
    static let textPlaceholder = Color(hex: 0x666B87)

    // The on-screen "remote cursor" — deliberately NOT marigold, since
    // marigold also fills a *selected* radio-style pill (DecadeFilter),
    // and a focused-but-unselected pill needs to read as visually
    // distinct from an actually-selected one.
    static let focusRing = Color(hex: 0x8FD3FF)

    // Mirrors lib/decadeColors.ts's DECADE_COLORS.
    private static let decadeAccents: [DecadeId: Color] = [
        .sixties: Color(hex: 0x7ED321),
        .seventies: Color(hex: 0x4D9FFF),
        .eighties: Color(hex: 0xFF3FA4),
        .nineties: Color(hex: 0x8A6DFF),
        .twoThousands: Color(hex: 0x33D6FF),
        .twentyTens: Color(hex: 0xFF8A3D),
        .all: marigold,
    ]

    static func decadeAccent(for decade: DecadeId) -> Color {
        decadeAccents[decade] ?? marigold
    }

    // Mirrors $option-colors in app/styles/_theme.scss — the A/B/C/D
    // answer colors players see on their phones, so "the pink one" means
    // the same answer on both screens. Deliberately clear of teal/coral,
    // which mean right/wrong.
    static let options: [Color] = [
        Color(hex: 0xFFB238),
        Color(hex: 0x4D9FFF),
        Color(hex: 0xA879FF),
        Color(hex: 0xFF5FAE),
    ]
}

// The session's marquee accent — marigold by default, or the picked
// decade's color once one's chosen in the lobby. The native equivalent of
// the web's `--marigold` custom property override (_decade-themes.scss):
// RootView sets it once, and every screen reads it instead of
// TWTColor.marigold, so the TV matches the decade theme the phones show.
private struct TWTAccentKey: EnvironmentKey {
    static let defaultValue = TWTColor.marigold
}

extension EnvironmentValues {
    var twtAccent: Color {
        get { self[TWTAccentKey.self] }
        set { self[TWTAccentKey.self] = newValue }
    }
}
