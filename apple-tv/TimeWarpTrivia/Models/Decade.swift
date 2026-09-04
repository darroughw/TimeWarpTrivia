import Foundation

// Mirrors lib/types.ts's Decade — the lobby's decade filter is
// data-driven (fetched from the `decades` table), not hardcoded, so a
// new decade becomes a data change, not a code deploy.
struct Decade: Identifiable, Equatable {
    let id: DecadeId
    let label: String
}

// Client-side-only sentinel appended to the fetched decade list — mirrors
// lib/decadeColors.ts's ALL_DECADES_OPTION. Never a real `decades` row.
let allDecadesOption = Decade(id: .all, label: "All Decades")

// Raw `decades` table row (id/label only — sort_order/is_active are
// filtered/ordered server-side by the query itself, not needed client-side).
struct DecadeRow: Codable, Equatable {
    let id: DecadeId
    let label: String
}
