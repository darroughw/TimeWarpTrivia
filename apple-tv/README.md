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

## There is no `.xcodeproj` here yet — read this before opening Xcode

Every other file in this directory (the Swift source, `.gitignore`) was
hand-written against standard Xcode/SwiftUI/WKWebView conventions, same
as `android-tv/`'s Kotlin was written unverified — **but this went one
step further than that project did.** The machine this was authored on
has only Xcode's Command Line Tools, not full Xcode.app, and is on
macOS 12 — too old for the Xcode version modern tooling (`xcodegen`, a
CLI project-file generator that was the first thing tried) requires. That
means the actual `.xcodeproj`/`.pbxproj` project file — the part that's
genuinely risky to hand-write blind, unlike source files — could not be
generated or opened here at all, not even to check that it parses.

**First step on a machine with real Xcode:**

1. `File > New > Project… > tvOS > App`.
2. Product Name: `TimeWarpTrivia`. Interface: **SwiftUI**. Language:
   **Swift**. Uncheck any tests/Core Data options — none are needed.
3. Save it **as this `apple-tv/` directory** (or create it elsewhere and
   move `TimeWarpTrivia.xcodeproj` into `apple-tv/` after) so the project
   lives alongside this README.
4. Xcode's template drops in its own `TimeWarpTriviaApp.swift`,
   `ContentView.swift`, and `Assets.xcassets` — **delete the template's
   versions of the two Swift files** (this directory's own
   `TimeWarpTriviaApp.swift`/`WebViewScreen.swift`/`WebViewController.swift`
   replace them) and **add this directory's three `.swift` files to the
   target** (`File > Add Files to "TimeWarpTrivia"…`). Keep the
   template's `Assets.xcassets` — there's no app icon here yet (see
   below).
5. Build and run — Xcode manages the tvOS SDK and simulator device for
   you (`Product > Destination > Apple TV` simulator, or a physical
   Apple TV in developer mode over the network).

Treat that first build as the real first test of everything in this
directory, same caveat `android-tv/`'s README gives its own
unverified-by-a-real-build Kotlin.

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

- **No app icon / launch assets.** tvOS app icons need a layered
  Front/Middle/Back structure for the home-screen parallax effect —
  meaningfully more work than Android's flat `mipmap` icons, and not
  started. Xcode's template `Assets.xcassets` is a placeholder for now.
- **No settings screen, no App Store listing.** Same reasoning as
  `android-tv/`: nothing to configure, and store submission is a manual
  step outside this repo.
- **No signing/release-build docs yet** — `android-tv/`'s README has a
  full section on generating and safely storing an upload key; the tvOS
  equivalent (an Apple Developer account, a distribution certificate,
  App Store Connect) is a later step once the app itself is verified
  working.
