import SwiftUI

// Mirrors app/styles/_theme.scss's three font roles — Archivo for body/UI
// copy, Archivo Black for marquee headlines, Space Mono for timers/
// scores/room codes. Registered via project.yml's UIAppFonts (see
// Resources/Fonts/); PostScript names below were read directly from
// each downloaded .ttf's 'name' table, not guessed.
enum TWTFont {
    private enum PostScriptName {
        static let archivoRegular = "Archivo-Regular"
        static let archivoBold = "Archivo-Bold"
        static let archivoBlack = "ArchivoBlack-Regular"
        static let spaceMonoRegular = "SpaceMono-Regular"
        static let spaceMonoBold = "SpaceMono-Bold"
    }

    // Body/UI copy — $paper-font.
    static func body(_ size: CGFloat) -> Font {
        .custom(PostScriptName.archivoRegular, size: size)
    }

    static func bodyBold(_ size: CGFloat) -> Font {
        .custom(PostScriptName.archivoBold, size: size)
    }

    // Marquee headlines — $head-font. Archivo Black only ships weight
    // 400; there's no separate bold cut to ask for.
    static func headline(_ size: CGFloat) -> Font {
        .custom(PostScriptName.archivoBlack, size: size)
    }

    // Timers, scores, room codes — $mono-font.
    static func mono(_ size: CGFloat) -> Font {
        .custom(PostScriptName.spaceMonoRegular, size: size)
    }

    static func monoBold(_ size: CGFloat) -> Font {
        .custom(PostScriptName.spaceMonoBold, size: size)
    }
}
