import Foundation

// Direct port of lib/mockData.ts's rankedByScore/pickBlockChooser.
extension Array where Element == Player {
    func rankedByScore() -> [Player] {
        sorted { $0.score > $1.score }
    }

    // The lowest-scoring *active* player is the one choosing a block
    // target before the final round — a player the host has removed
    // can't be handed the choice, or nobody's phone would ever render
    // the picker and the game would stall. TV and each phone compute
    // this independently and must agree, hence the shared, pure logic.
    func pickBlockChooser() -> Player? {
        let active = filter { $0.status == .active }
        return active.rankedByScore().last
    }
}
