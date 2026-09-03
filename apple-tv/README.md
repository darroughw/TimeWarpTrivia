# TimeWarp Trivia — Apple TV

A thin native wrapper (TIM-23) around the real web app, for tvOS's App
Store and home screen — the same idea as [`android-tv/`](../android-tv),
not a second implementation. One screen with a full-screen `WKWebView`
pointed at [`/tv`](../app/tv/page.tsx), the web app's own TV entry point.
Every actual screen (lobby, question, scoreboard, block, end game, help)
is the same D-pad-navigable web app real browsers hit — see the main
project's `hooks/useDpadNavigation.ts`.

## Why a separate directory, not React Native / a second UI

Same reasoning as `android-tv/`'s README: a WebView wrapper reuses 100%
of the already-built, already-D-pad-tested web app. Re-implementing every
screen in SwiftUI natively would mean rebuilding the whole focus system
and the Supabase Realtime wiring a second time for no functional gain.
This directory is intentionally just a shell.

## `.xcodeproj` is generated, not hand-written — still unverified by a real build

The Swift source and `.gitignore` were hand-written against standard
Xcode/SwiftUI/WKWebView conventions, same as `android-tv/`'s Kotlin was
written unverified. The `.xcodeproj`/`.pbxproj` itself — the part that's
genuinely risky to hand-write blind — is **generated from
[`project.yml`](project.yml) by [xcodegen](https://github.com/yonaskolb/XcodeGen)**
instead, which this machine (now on a current macOS, `brew install
xcodegen`) could actually run and produce a structurally valid project
file (`plutil -lint` on `project.pbxproj` passes). What this machine still
lacks is full `Xcode.app` (only the Command Line Tools are installed), so
`xcodebuild` itself has no tvOS SDK to build against here — the project
has been generated but not yet opened, built, or run by real Xcode.
Treat that first build in real Xcode as the actual first test of
everything in this directory, same caveat `android-tv/`'s Kotlin carries.

**On a machine with real Xcode:**

1. Just open `TimeWarpTrivia.xcodeproj` — it's already checked in,
   generated from `project.yml`. No `File > New > Project…` needed.
2. Build and run — Xcode manages the tvOS SDK and simulator device for
   you (`Product > Destination > Apple TV` simulator, or a physical
   Apple TV in developer mode over the network).
3. If you change `project.yml` (new target settings, new source files
   outside the existing `TimeWarpTrivia/` folder, etc.), regenerate with
   `xcodegen generate` from this directory rather than hand-editing
   `project.pbxproj` — xcodegen owns that file now. Plain new `.swift`
   files dropped into `TimeWarpTrivia/` are picked up automatically by
   the folder-reference source path in `project.yml`, no regeneration
   needed.

## Signing / building a release archive

Unlike `android-tv/`'s keystore (a file you generate once and must never
lose), tvOS signing runs through an Apple Developer account, and the
identity that matters — the bundle ID (`com.timewarptrivia.appletv`,
already set in [`project.yml`](project.yml)) plus your Team ID — isn't
tied to a single certificate the way an Android upload key is. Certs can
be revoked and regenerated from the developer portal at any time without
breaking the app's identity or its ability to update on the App Store.

1. **Enroll in the Apple Developer Program** (developer.apple.com,
   $99/year) if you haven't — required for running on a physical Apple
   TV, TestFlight, and App Store submission alike. A free account can
   still build and run in the simulator.
2. **Sign into that Apple ID in Xcode** (Xcode > Settings > Accounts)
   before opening this project. Automatic signing (already the default
   here — see below) resolves your Team from that signed-in account and
   registers the bundle ID for you on first build; nothing needs to be
   pre-registered by hand in the developer portal.
3. **Set your Team ID in [`Signing.xcconfig`](Signing.xcconfig)**, not in
   Xcode's Signing & Capabilities tab. `project.yml` wires this file in
   via xcodegen's `configFiles` (`baseConfigurationReference` in the
   generated `.pbxproj`), which is what lets it survive `xcodegen
   generate` — a team picked through the Xcode UI instead gets written
   into `project.pbxproj`, which xcodegen owns and will silently discard
   on the next regeneration. Find your Team ID at developer.apple.com >
   Account > Membership, or in Xcode's Accounts settings under your Apple
   ID. `Signing.xcconfig` is committed (it's already in this repo, blank
   `DEVELOPMENT_TEAM`) rather than gitignored like `android-tv/`'s
   `keystore.properties` — a Team ID isn't a credential (it's visible in
   App Store Connect URLs and exported archive metadata already), and
   xcodegen hard-fails `generate` if a `configFiles` path doesn't exist,
   so an out-of-the-box checkout needs *some* file there even before
   anyone's filled in their own team.
4. **Archive**: `Product > Destination > Any tvOS Device (arm64)` (real
   device or App Store distribution both need a device destination, not
   the simulator), then `Product > Archive`. Xcode's Organizer opens on
   success; `Distribute App > App Store Connect > Upload` handles export
   and upload in one flow, resolving a distribution certificate and
   provisioning profile automatically under automatic signing.
5. **Create the App Store Connect record** before or after that first
   archive (either order works) — appstoreconnect.apple.com > My Apps >
   `+` > New App, platform tvOS, matching bundle ID
   `com.timewarptrivia.appletv`, plus a name, primary language, and SKU
   (any internal identifier, e.g. `timewarptrivia-appletv`).
6. **TestFlight** is the natural next step after an upload, same role
   Play Console's internal testing track plays for `android-tv/`: once a
   build finishes processing in App Store Connect's TestFlight tab,
   internal testers (up to 100, your own team) get it with no review;
   external testers need a lightweight Beta App Review first (usually
   under a day), same as `android-tv/`'s closed testing track needing
   Play's review before external testers can join.

**None of this has been exercised against a real Apple Developer
account** — same unverified-until-a-real-build caveat as the rest of
this directory, and more so here since it also depends on an active paid
enrollment this machine doesn't have. A command-line path exists too
(`xcodebuild archive` + `xcodebuild -exportArchive` with an
`exportOptions.plist`, for scripting or CI later) but is unverified for
the same reason — no full Xcode/tvOS SDK on this machine to try it
against, per the top of this README.

## The Siri Remote → web app bridge

This is the one piece of real design work in `WebViewController.swift`,
and the one thing with no Android equivalent needed. Android's WebView
forwards D-pad `KeyEvent`s as ordinary DOM `keydown` events on its own —
`useDpadNavigation.ts`'s `container.addEventListener("keydown", ...)`
just works once the WebView has focus, no native code required beyond
`requestFocus()`. WKWebView on tvOS does **not** do this for a Siri
Remote's touch surface: presses arrive as `UIPress` events in native
code, invisible to JavaScript, full stop.

`WebViewController` intercepts `pressesBegan(_:with:)` and injects a real
`KeyboardEvent` into the page via `evaluateJavaScript`, dispatched on
`document.activeElement` so it bubbles up through the same ancestor chain
a genuine browser keydown would — exactly what both
`useDpadNavigation`'s container-scoped listeners and the flow
controllers' `window.addEventListener("keydown", ...)` passive-advance
listeners (`LiveTvFlow`'s "Press → or Enter to continue", etc.) expect.
Arrow presses map to `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`;
Select maps to `Enter` (which also fires a focused `<button>`'s own click
via the HTML spec's default action, so no separate synthetic click is
needed); Menu is deliberately left unmapped, falling through to tvOS's
own system handling — the same "defer to the system" fallback Android's
back-button handler uses when there's nowhere in-app left to go.

**This has not been tested against a real Siri Remote or the tvOS
simulator's remote emulation**, and there's one specific failure mode
worth knowing about going in: tvOS's WKWebView has its own built-in
spatial-navigation handling for focusable HTML content, separate from
this bridge. If arrow presses seem to do *something* (focus visibly moves
inside the page) but the game's own `useDpadNavigation` logic never
runs — no wraparound, focus escaping a modal it shouldn't — that's
WKWebView's native handling intercepting the press before
`pressesBegan(_:with:)` ever sees it, not a bug in the bridge itself.
There's no documented flag to disable that native behavior; the fix
would likely mean digging into `WKWebView`'s undocumented input-handling
internals or reconsidering the approach entirely. Confirm arrow keys
reach the bridge at all (log inside `dispatchKeydown`) before debugging
anything downstream of it.

The `KeyboardEvent` construction and `UIPress.PressType` mapping
otherwise are correct against Apple's/the DOM's documented APIs, but
whether every screen's focus actually lands where expected — especially
`useDpadNavigation`'s focus-trap containers
(`LobbyScreen`, `EndGameScreen`, `HelpModal`) — is unverified. Start
there if something feels unreachable with a real remote.

## Pointing at a local dev server while iterating

`WebViewController.swift`'s `appUrl` is a single hardcoded constant,
same one-screen-app reasoning as `android-tv/`'s equivalent. To test
against a local `npm run dev` instead of production, temporarily change
it to your machine's LAN IP (the tvOS simulator can reach your Mac's
`localhost` directly, unlike an Android emulator — but a physical Apple
TV on the network still needs the LAN IP) and change it back before
committing.

## Offline/error state

If the main-frame load fails outright (no connection, DNS failure,
4xx/5xx on `/tv` itself), `WebViewController`'s `WKNavigationDelegate`
swaps in a native "Lost the signal" screen — void background, marigold
accent, a single autofocused Retry button — instead of leaving
WKWebView's own error rendering on screen. Same behavior and colors as
`android-tv/`'s equivalent (see that README's "Offline/error state").
Sub-resource failures (a font, an image) don't trigger it — only the
main document.

## What's deliberately not built

- **App icon and Top Shelf Image exist but are unverified.**
  `Assets.xcassets/App Icon & Top Shelf Image.brandassets/` has the
  layered Front/Middle/Back home screen icon, built from the same brand
  mark as `android-tv/`'s `playstore/icon-512.png` (see
  [`icon-source/`](icon-source) for the three subset SVGs it's
  rasterized from — the TV frame silhouette as Middle, the wordmark as
  Front, both via `rsvg-convert`, over a solid void-navy Back;
  `combined-icon.svg` is the flattened composite of all three, kept only
  as the source the Top Shelf Image was rasterized from). The Top Shelf
  Image (the wide banner shown when the icon is focused/highlighted on
  the home screen, at `Top Shelf Image.imageset`) reuses that same
  composite artwork centered on the void-navy field, 80% height with
  margin on all sides, rather than unique wide key art — same fallback
  reasoning as reusing the app icon mark instead of designing a second
  asset. Both are 1x/2x pairs (1920x720 / 3840x1440). The
  `.imagestack`/`.imagestacklayer`/`.imageset` folder structure and their
  `Contents.json` files were hand-written against documented tvOS asset
  catalog conventions, same unverified-until-a-real-build caveat as
  everything else in this directory — actool hasn't compiled this
  catalog yet.
- **No settings screen.** Same reasoning as `android-tv/`: nothing to
  configure. Store listing copy *is* built now — see "App Store listing"
  below — what's still outside this repo is actually filling out App
  Store Connect with it and submitting for review.

## App Store listing (TIM-23)

`store-assets/app-store/` has the store listing content, same role
`android-tv/`'s `store-assets/google-play/` and `store-assets/fire-tv/`
play for those platforms: `subtitle.txt` (30-char cap),
`promotional-text.txt` (170-char cap, the one field App Store Connect
lets you edit anytime without a new build or review), `description.txt`
(4000-char cap), `keywords.txt` (100-char cap, comma-separated, no
spaces to save characters), `app-review-notes.txt` (paste-ready text for
the App Review "Notes" field — same role Fire TV's
`testing-instructions.txt` plays, adapted for the Siri Remote and "no
demo account needed"), and `app-store-connect-checklist.txt` (everything
App Store Connect's submission form asks for that doesn't have a
repo-file equivalent — the app record, category, age rating
questionnaire, and an App Privacy "nutrition label" section mapped
straight from `android-tv/`'s Data Safety form reasoning, since it's the
same app and the same actual data practices behind both).

`screenshots/` has the same five moments as the other two platforms'
sets (intro, lobby, question, scoreboard, final results) at 1920x1080,
captured the same way — headless Chrome against `npm run dev` in
mock/demo mode (`MockTvFlow`, the same no-backend scripted flow the
Fire TV/Google Play sets used) — except via `capture-screenshots.js`
(puppeteer-core driving the system Chrome.app) rather than a one-off CLI
screenshot, since advancing past the transition/scoreboard/block screens
needs real `ArrowRight`/`Enter` keydowns; only the question screens'
own countdown timer advances on its own. That script is checked in
(unlike whatever produced the Fire TV/Google Play sets, apparently), so
regenerating after a UI change is a re-run, not a rebuild.

Still outside this repo, same as the other two platforms: actually
filling out App Store Connect with the above and submitting for review —
and unlike Fire TV's straight-to-review submission or even Google Play's
closed-testing gate, this also needs the first real signed archive from
"Signing / building a release archive" above to exist at all first.
