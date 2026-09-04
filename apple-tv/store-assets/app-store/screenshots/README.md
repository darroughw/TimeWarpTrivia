# How these were captured

Retaken against the real native SwiftUI app (see `apple-tv/README.md` —
the original WebView wrapper this directory's `capture-screenshots.js`
targeted no longer exists; that script drove headless Chrome against the
web app's `MockTvFlow`, which has nothing to do with what's actually
running here anymore) at 3840x2160 (tvOS's 2x screenshot spec) in the
tvOS Simulator, then flattened from RGBA to RGB — Apple's screenshot
upload requires fully opaque images, and `xcrun simctl io screenshot`
captures with an alpha channel.

Since the native app has no scriptable/headless run mode the way a
browser does, there's no single command to reproduce these — the actual
process, for whenever they need retaking:

1. Boot a tvOS Simulator and run the app (`xcodebuild ... build`,
   `xcrun simctl install`, `xcrun simctl launch`).
2. For **intro** (`screenshot-1-intro.png`): screenshot immediately,
   before pressing Start.
3. For the rest: since there's no way to click the on-screen Start/Start
   Game buttons from a script, this needs a **temporary** `.task { await
   flow.bootstrap() }` on `RootView` (not `IntroView` — SwiftUI cancels
   a `.task` the instant its view disappears, and `IntroView` disappears
   the moment the room's created, before the rest of a chained task body
   ever runs) — revert it before committing anything.
4. Insert a few players directly via a REST POST to `/players` (the
   anon key has insert access — see `apple-tv/README.md`'s Supabase
   section) using the same roster `lib/mockData.ts`'s `MOCK_PLAYERS`
   uses (Deja View, Rad Wave, Cassette Ghost, Y2Kayla, Blorbo, Neon Dad)
   for visual consistency with the other two platforms' store assets.
   Screenshot for **lobby**.
5. Extend that same temporary task to poll `flow.canStartGame` and call
   the real `flow.handleStartGame()` once true, to reach a real,
   validly-cached **question** screen naturally (not a debug bypass —
   this exercises the actual game-start code path).
6. For **scoreboard** and **final-results**, PATCH the room's `status`
   directly via REST (`scoreboard`, then `end`) rather than waiting
   through real question timers — also update `players.score` first to
   get a readable score spread (this repo's earlier verification passes
   used 340/260/410/180/395/120 for the same six names, matching
   `lib/mockData.ts`'s `MOCK_ROUND_RESULT` numbers).

These are real captures of the real native app, not mockups — same
caveat the other two platforms' screenshot sets carry: if App Review
wants device-sourced screenshots specifically, recapture from a real
Apple TV instead of the Simulator.
