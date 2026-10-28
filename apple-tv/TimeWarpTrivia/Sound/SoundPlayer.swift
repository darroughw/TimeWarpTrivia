import AVFoundation

// Direct port of lib/sounds.ts's playSound/preloadAllSounds/isSoundEnabled/
// setSoundEnabled: one AVAudioPlayer per sound, reused across plays
// (seek-to-0 restarts it) rather than a fresh player per call — avoids
// piling up unreleased players when a sound fires repeatedly (the
// urgency tick, once a second for 5 seconds straight). Mute persisted in
// UserDefaults under the same key name the web version uses in
// localStorage, for naming consistency only (the two storages are
// unrelated).
@MainActor
final class SoundPlayer {
    static let shared = SoundPlayer()

    private static let storageKey = "twt-sound-enabled"

    var isEnabled: Bool {
        get {
            // Web default: unset -> on. UserDefaults.bool(forKey:) already
            // defaults missing keys to false, so this needs an explicit
            // "has a value at all" check to match that "on by default".
            UserDefaults.standard.object(forKey: Self.storageKey) as? Bool ?? true
        }
        set {
            UserDefaults.standard.set(newValue, forKey: Self.storageKey)
        }
    }

    private var players: [SoundID: AVAudioPlayer] = [:]

    private init() {
        try? AVAudioSession.sharedInstance().setCategory(.ambient)
    }

    // Warms every player ahead of time so the first real play() doesn't
    // pay for the disk read — called once, at app launch
    // (GameFlowViewModel.bootstrap()).
    func preloadAll() {
        for id in SoundID.allCases {
            _ = player(for: id)
        }
    }

    func play(_ id: SoundID) {
        guard isEnabled, let player = player(for: id) else { return }
        player.currentTime = 0
        player.play()
    }

    private func player(for id: SoundID) -> AVAudioPlayer? {
        if let existing = players[id] { return existing }
        guard let url = Bundle.main.url(forResource: id.filename, withExtension: id.fileExtension) else { return nil }
        guard let player = try? AVAudioPlayer(contentsOf: url) else { return nil }
        player.prepareToPlay()
        players[id] = player
        return player
    }
}
