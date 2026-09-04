import CoreGraphics

// rem->pt direct numeric port of app/styles/_theme.scss's spacing scale
// (16px base) — the web app is already a 10-foot UI, so no additional
// TV-specific scale-up is applied on top.
enum TWTSpacing {
    static let xs: CGFloat = 8
    static let sm: CGFloat = 16
    static let md: CGFloat = 28
    static let lg: CGFloat = 48
    static let xl: CGFloat = 80
    static let xxl: CGFloat = 128
}

enum TWTRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 28
}

let twtBorderWidth: CGFloat = 3

enum TWTFocusRing {
    static let width: CGFloat = 4
    static let offset: CGFloat = 6
}
