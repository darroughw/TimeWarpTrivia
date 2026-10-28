import Foundation

// A Deep Cuts topic (TIM-41) — mirrors lib/types.ts's DeepCutTopic and
// the deep_cut_topics table (supabase/migrations/0008_deep_cuts.sql:
// id, label, sort_order, is_active). Structurally parallel to Decade,
// but with an open-ended string id, since new topics are added as data
// with no code change.
struct DeepCutTopic: Codable, Identifiable, Equatable {
    let id: String
    let label: String
}
