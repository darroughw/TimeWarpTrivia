# TimeWarp Trivia — Apple TV

A native SwiftUI app (TIM-23) for tvOS's App Store and home screen, talking
directly to the same Supabase backend ([`lib/database.types.ts`](../lib/database.types.ts))
the web app already uses — no server of its own, anon-key-only, Row Level
Security is the actual access boundary. Every screen (intro, lobby, round
start, question, transition, scoreboard, block round, solo question, end
game) is a native SwiftUI view under [`TimeWarpTrivia/Views/`](TimeWarpTrivia/Views),
driven by a single `GameFlowViewModel` state machine mirroring the web app's
`LiveTvFlow.tsx` handler-for-handler.

## Why native, not a WebView wrapper

This directory started as a thin `WKWebView` shell around the web app's `/tv`
route, the same approach [`android-tv/`](../android-tv) uses successfully.
That's not possible on tvOS: **`WebKit.framework` and `SafariServices.framework`
don't exist on the platform at all** — confirmed directly against the tvOS SDK
on disk, not just a missing import. Apple TV apps cannot embed a web view or
browser control, full stop. The WebView-wrapper git history (`WebViewController.swift`,
`WebViewScreen.swift`, the Siri Remote → DOM `keydown` injection bridge) was
deleted for this reason; see git log if any of that reasoning is useful for
context, but none of it applies to what's actually in this directory now.

## `.xcodeproj` is generated, not hand-written

The `.xcodeproj`/`.pbxproj` is **generated from [`project.yml`](project.yml)
by [xcodegen](https://github.com/yonaskolb/XcodeGen)** (`brew install
xcodegen`), not committed as hand-edited Xcode state. Swift package
resolution (the `supabase-swift` dependency) happens on first open/build in
real Xcode and needs network access.

**On a machine with real Xcode:**

1. Just open `TimeWarpTrivia.xcodeproj` — it's already checked in, generated
   from `project.yml`. No `File > New > Project…` needed.
2. Build and run — Xcode manages the tvOS SDK and simulator device for you
   (`Product > Destination > Apple TV` simulator, or a physical Apple TV in
   developer mode over the network). tvOS 16.0 is the deployment target.
3. If you change `project.yml` (new target settings, new source files
   outside the existing `TimeWarpTrivia/` folder, new fonts/sounds under
   `Resources/`, etc.), regenerate with `xcodegen generate` from this
   directory rather than hand-editing `project.pbxproj` — xcodegen owns that
   file now. That includes adding, removing, or renaming any `.swift`
   file: the generated project lists every source file explicitly, so a
   new file isn't part of the build until you regenerate.

## Backend configuration

[`Config.swift`](TimeWarpTrivia/Config/Config.swift) has the Supabase project
URL and anon key as plain Swift constants — not secrets (Row Level Security
is the real boundary; the anon key is meant to be client-embedded per
Supabase's own security model), and not routed through Info.plist, because
`GENERATE_INFOPLIST_FILE`'s `INFOPLIST_KEY_*` build-setting bridge only
recognizes Apple's own curated list of known Info.plist keys — a custom key
name is silently dropped rather than injected, so that indirection was tried
and removed. Same production project the web app's `NEXT_PUBLIC_SUPABASE_URL`/
`NEXT_PUBLIC_SUPABASE_ANON_KEY` already point at — no separate backend to
stand up or point at a local dev server for.

## Signing / building a release archive

tvOS signing runs through an Apple Developer account, and the identity that
matters — the bundle ID (`com.timewarptrivia.appletv`, already set in
[`project.yml`](project.yml)) plus your Team ID — isn't tied to a single
certificate the way an Android upload key is. Certs can be revoked and
regenerated from the developer portal at any time without breaking the app's
identity or its ability to update on the App Store.

1. **Enroll in the Apple Developer Program** (developer.apple.com,
   $99/year) if you haven't — required for running on a physical Apple TV,
   TestFlight, and App Store submission alike. A free account can still
   build and run in the simulator.
2. **Sign into that Apple ID in Xcode** (Xcode > Settings > Accounts) before
   opening this project. Automatic signing (already the default here — see
   below) resolves your Team from that signed-in account and registers the
   bundle ID for you on first build; nothing needs to be pre-registered by
   hand in the developer portal.
3. **Set your Team ID in [`Signing.xcconfig`](Signing.xcconfig)**, not in
   Xcode's Signing & Capabilities tab. `project.yml` wires this file in via
   xcodegen's `configFiles` (`baseConfigurationReference` in the generated
   `.pbxproj`), which is what lets it survive `xcodegen generate` — a team
   picked through the Xcode UI instead gets written into `project.pbxproj`,
   which xcodegen owns and will silently discard on the next regeneration.
   Find your Team ID at developer.apple.com > Account > Membership, or in
   Xcode's Accounts settings under your Apple ID. `Signing.xcconfig` is
   committed (blank `DEVELOPMENT_TEAM`) rather than gitignored — a Team ID
   isn't a credential (it's visible in App Store Connect URLs and exported
   archive metadata already), and xcodegen hard-fails `generate` if a
   `configFiles` path doesn't exist, so an out-of-the-box checkout needs
   *some* file there even before anyone's filled in their own team.
4. **Archive**: `Product > Destination > Any tvOS Device (arm64)` (real
   device or App Store distribution both need a device destination, not the
   simulator), then `Product > Archive`. Xcode's Organizer opens on success;
   `Distribute App > App Store Connect > Upload` handles export and upload
   in one flow, resolving a distribution certificate and provisioning
   profile automatically under automatic signing.
5. **Create the App Store Connect record** before or after that first
   archive (either order works) — appstoreconnect.apple.com > My Apps > `+`
   > New App, platform tvOS, matching bundle ID
   `com.timewarptrivia.appletv`, plus a name, primary language, and SKU
   (any internal identifier, e.g. `timewarptrivia-appletv`). See
   `store-assets/app-store/app-store-connect-checklist.txt` for the full
   submission-form field list.
6. **TestFlight** is the natural next step after an upload: once a build
   finishes processing in App Store Connect's TestFlight tab, internal
   testers (up to 100, your own team) get it with no review; external
   testers need a lightweight Beta App Review first (usually under a day).

A command-line path exists too (`xcodebuild archive` +
`xcodebuild -exportArchive` with an `exportOptions.plist`, for scripting or
CI later) but hasn't been exercised in this repo.

## Siri Remote input

No custom input bridge is needed — every screen uses ordinary SwiftUI
focusable controls (`Button`, `.focusable()`), so the tvOS focus engine and
Siri Remote handle navigation and selection natively. Two screen-specific
patterns worth knowing about:

- **Passive-advance screens** (round transition, scoreboard, solo
  transition) have no visible focusable "continue" control, matching the
  web app's own hint-only UX on those screens. `PassiveAdvanceContainer`
  (see [`Views/Components/`](TimeWarpTrivia/Views/Components)) wraps them
  with an invisible, `.prefersDefaultFocus(true)`, tightly-framed button
  (catches a bare Select press) plus `.onMoveCommand { if $0 == .right {
  ... } }` (catches a swipe-right regardless of focus) — framed to a near-
  zero size deliberately, since an unconstrained `Color.clear` in a
  `ZStack` expands to fill the available space and triggers tvOS's
  full-screen focus-lift effect on the whole screen once focused.
- **Sound mute** is bound to the Siri Remote's Play/Pause button globally
  (`.onPlayPauseCommand` at the root view), not a focusable on-screen
  toggle.

## Offline/error state

[`OfflineErrorView.swift`](TimeWarpTrivia/Views/OfflineErrorView.swift) is
shown when `GameFlowViewModel.bootstrap()` fails to create a room at launch
(no connection, Supabase unreachable) — void background, marigold accent, a
single autofocused Retry button, matching `android-tv/`'s equivalent screen.
This covers the one failure tvOS-native has an equivalent for at the "can we
even load" moment a WebView's main-frame failure used to represent; it does
not cover a connection dropping mid-game (Realtime silently attempts to
reconnect in that case).

## What's deliberately not built

- **Deep Cuts mode** (topic-pack lobby variant) — decade mode only for v1;
  the service layer already takes decade-or-topic as a parameter so this is
  a fast-follow, not a backend rewrite.
- **A Feedback modal on TV** — free-text entry via the Siri Remote's
  on-screen keyboard is bad UX for a form that's already available on
  phone/web. The Help modal is still present.
- **No settings screen.** Nothing to configure.

App icon and Top Shelf Image: `Assets.xcassets/App Icon & Top Shelf
Image.brandassets/` has all four assets tvOS requires — the layered
Front/Middle/Back home screen icon (`App Icon.imagestack`, 400x240/800x480),
the flattened App Store listing icon (`App Icon - App Store.imagestack`,
1280x768, single scale, same three layers rasterized larger), and both
Top Shelf banners (`Top Shelf Image.imageset` 1920x720/3840x1440 and
`Top Shelf Image Wide.imageset` 2320x720/4640x1440) — all built from the
same brand mark as `android-tv/`'s `playstore/icon-512.png` (see
[`icon-source/`](icon-source) for the source SVGs). Both Top Shelf images
reuse that same composite artwork centered on the void-navy field (80% of
canvas height) rather than unique wide key art. All four asset roles are
required by App Store Connect's binary validation — missing any one of them
(as an earlier upload attempt did, for the App Store icon and the wide Top
Shelf image) fails upload with error 90471/90513, not just a warning.

## App Store listing (TIM-23)

`store-assets/app-store/` has the store listing content, same role
`android-tv/`'s `store-assets/google-play/` and `store-assets/fire-tv/` play
for those platforms: `subtitle.txt` (30-char cap), `promotional-text.txt`
(170-char cap, the one field App Store Connect lets you edit anytime without
a new build or review), `description.txt` (4000-char cap), `keywords.txt`
(100-char cap, comma-separated, no spaces to save characters),
`app-review-notes.txt` (paste-ready text for the App Review "Notes" field),
and `app-store-connect-checklist.txt` (everything App Store Connect's
submission form asks for that doesn't have a repo-file equivalent).

`screenshots/` has the same five moments as the other two platforms' sets
(intro, lobby, question, scoreboard, final results) at 3840x2160, captured
against the real native app running in the tvOS Simulator — see
`screenshots/README.md` for the exact capture process, which involves
driving the app via direct Supabase REST calls (insert players, patch room
status) rather than a script, since there's no scriptable/headless run mode
for a native app the way a browser has.

Still outside this repo: actually filling out App Store Connect with the
above and submitting for review, which needs the first real signed archive
from "Signing / building a release archive" above to exist first.
