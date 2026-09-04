import Foundation

// Direct port of lib/taunts.ts. Dry, deadpan jabs at whoever isn't in
// first place between questions — never cruel or mean-spirited.
enum Taunts {
    private static let templates = [
        "{name} is currently mounting a historic comeback. Historically, from here, it never works.",
        "{name} is, technically, still in the game. Legally too.",
        "Somewhere out there, {name} is beating someone. Not in this room, but somewhere.",
        "{name} has entered the \"it's not about winning\" phase of the evening.",
        "Good news for {name}: nowhere to go but up. Bad news: there's a lot of up.",
        "{name} is playing a different game. That game is called Catching Up.",
        "Rumor has it {name} peaked during the lobby screen.",
        "{name}'s strategy appears to be letting everyone else go first. Bold.",
        "Nobody's told {name} yet, but there is, in fact, a scoreboard.",
        "{name} remains undefeated in the category of Not First Place.",
        "{name} is saving their best round for later. Presumably.",
        "Statistically, {name} could still win this. Statisticians hate that framing too.",
    ]

    // Picks one active, non-first-place player at random and returns a
    // random taunt line for them. Returns nil when there's no one to
    // taunt — every active player tied for the lead, or too few active
    // players to rank.
    static func pickTaunt(players: [Player]) -> String? {
        let active = players.filter { $0.status == .active }
        guard active.count >= 2 else { return nil }

        let ranked = active.rankedByScore()
        let leadScore = ranked[0].score
        let trailing = ranked.filter { $0.score < leadScore }
        guard let target = trailing.randomElement(), let template = templates.randomElement() else { return nil }
        return template.replacingOccurrences(of: "{name}", with: target.name)
    }
}
