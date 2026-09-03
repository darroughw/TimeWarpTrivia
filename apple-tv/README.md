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

- **App icon exists but is unverified.** `Assets.xcassets/App Icon &
  Top Shelf Image.brandassets/` has the layered Front/Middle/Back home
  screen icon, built from the same brand mark as `android-tv/`'s
  `playstore/icon-512.png` (see [`icon-source/`](icon-source) for the
  three subset SVGs it's rasterized from — the TV frame silhouette as
  Middle, the wordmark as Front, both via `rsvg-convert`, over a solid
  void-navy Back). The `.imagestack`/`.imagestacklayer`/`.imageset`
  folder structure and their `Contents.json` files were hand-written
  against documented tvOS asset catalog conventions, same unverified-
  until-a-real-build caveat as everything else in this directory — actool
  hasn't compiled this catalog yet. **No Top Shelf Image** (the wide
  banner shown when the icon is focused/highlighted on the home screen)
  — only the app icon itself was built.
- **No settings screen, no App Store listing.** Same reasoning as
  `android-tv/`: nothing to configure, and store submission is a manual
  step outside this repo.
- **No signing/release-build docs yet** — `android-tv/`'s README has a
  full section on generating and safely storing an upload key; the tvOS
  equivalent (an Apple Developer account, a distribution certificate,
  App Store Connect) is a later step once the app itself is verified
  working.
