import AVFoundation

// Low-volume looping background music, played from the lobby through the
// last question (not on the end screen) — see GameFlowViewModel's
// syncBackgroundMusic(). Separate from SoundPlayer (one-shot SFX, a
// player per sound, reused via seek-to-0) since this is a single
// continuously-looping track with its own start/stop lifecycle and its
// own mute toggle (the lobbies' Music button) — distinct from the SFX
// mute, so a player can have one on and the other off.
// background-loop.m4a is an original composition generated for this app,
// not a recording or transcription of any existing copyrighted work.
@MainActor
final class MusicPlayer {
    static let shared = MusicPlayer()

    private static let storageKey = "twt-music-enabled"

    // Quiet enough to sit under the SFX and any TTS/VoiceOver output,
    // never compete with them — this is ambience, not a soundtrack.
    private let volume: Float = 0.11

    var isEnabled: Bool {
        get {
            UserDefaults.standard.object(forKey: Self.storageKey) as? Bool ?? true
        }
        set {
            UserDefaults.standard.set(newValue, forKey: Self.storageKey)
            if !newValue { stop() }
            // Turning it back on doesn't resume playback here — whether
            // music should be playing right now is still governed by
            // game state. Go through GameFlowViewModel.setMusicEnabled,
            // which re-syncs immediately.
        }
    }

    private var player: AVAudioPlayer?

    private init() {}

    func play() {
        guard isEnabled else { return }
        if let player, player.isPlaying { return }
        guard let player = player ?? makePlayer() else { return }
        self.player = player
        player.volume = volume
        player.play()
    }

    func stop() {
        player?.stop()
    }

    private func makePlayer() -> AVAudioPlayer? {
        guard let url = Bundle.main.url(forResource: "background-loop", withExtension: "m4a") else { return nil }
        guard let player = try? AVAudioPlayer(contentsOf: url) else { return nil }
        player.numberOfLoops = -1
        player.prepareToPlay()
        return player
    }
}
