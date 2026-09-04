import Foundation

// Mirrors lib/types.ts's DecadeId. "all" is a client-side-only sentinel
// (ALL_DECADES_OPTION in lib/decadeColors.ts) — never a real `decades`
// table row, but it IS a valid rooms.decade_filter value (the default).
enum DecadeId: String, Codable, Equatable, CaseIterable {
    case sixties = "60s"
    case seventies = "70s"
    case eighties = "80s"
    case nineties = "90s"
    case twoThousands = "2000s"
    case twentyTens = "2010s"
    case all
}
