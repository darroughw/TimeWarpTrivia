import SwiftUI

// Mirrors app/styles/_theme.scss's three font roles — Archivo for body/UI
// copy, Archivo Black for marquee headlines, Space Mono for timers/
// scores/room codes. Registered via project.yml's UIAppFonts (see
// Resources/Fonts/); PostScript names below were read directly from
// each downloaded .ttf's 'name' table, not guessed.
enum TWTFont {
    // Every size below is given in the web's rem-derived points and scaled
    // up here for the couch. tvOS lays out at 1920x1080pt, so the straight
    // port's 11-17pt labels were unreadable from across a room (Apple's
    // tvOS guidance puts body text around 23pt+). A uniform 1.4x keeps
    // the screens' existing hierarchy; the 22pt floor rescues the
    // smallest labels without blowing up everything else.
    private static let tvScale: CGFloat = 1.4
    private static let tvMinimum: CGFloat = 22

    private static func tv(_ size: CGFloat) -> CGFloat {
        max(tvMinimum, (size * tvScale).rounded())
    }

    private enum PostScriptName {
        static let archivoRegular = "Archivo-Regular"
        static let archivoBold = "Archivo-Bold"
        static let archivoBlack = "ArchivoBlack-Regular"
        static let barrio = "Barrio-Regular"
        static let spaceMonoRegular = "SpaceMono-Regular"
        static let spaceMonoBold = "SpaceMono-Bold"
    }

    // Body/UI copy — $paper-font.
    static func body(_ size: CGFloat) -> Font {
        .custom(PostScriptName.archivoRegular, size: tv(size))
    }

    static func bodyBold(_ size: CGFloat) -> Font {
        .custom(PostScriptName.archivoBold, size: tv(size))
    }

    // Marquee headlines — $head-font. Archivo Black only ships weight
    // 400; there's no separate bold cut to ask for.
    static func headline(_ size: CGFloat) -> Font {
        .custom(PostScriptName.archivoBlack, size: tv(size))
    }

    // Barrio, the logo's hand-cut display face — only for the
    // "TimeWarp Trivia" wordmark, the "Round N" countdown title, and the
    // "Final Results" title. Every other heading stays on headline().
    // Single weight.
    static func title(_ size: CGFloat) -> Font {
        .custom(PostScriptName.barrio, size: tv(size))
    }

    // Timers, scores, room codes — $mono-font.
    static func mono(_ size: CGFloat) -> Font {
        .custom(PostScriptName.spaceMonoRegular, size: tv(size))
    }

    static func monoBold(_ size: CGFloat) -> Font {
        .custom(PostScriptName.spaceMonoBold, size: tv(size))
    }
}
