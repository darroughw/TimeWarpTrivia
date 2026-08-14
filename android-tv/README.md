# TimeWarp Trivia — Android TV

A thin native wrapper (TIM-10) around the real web app, for Android TV's
Play Store and home screen. There's no separate TV codebase here — this
is one `Activity` with a full-screen `WebView` pointed at
[`/tv`](../app/tv/page.tsx), the web app's own Android-TV entry point.
Every actual screen (lobby, question, scoreboard, block, end game, help)
is the same D-pad-navigable web app real browsers hit — see the main
project's `hooks/useDpadNavigation.ts` and the TIM-26 scroll-audit pass
that made every TV screen fit `100vh` without needing to scroll.

## Why a separate directory, not React Native

Covered in more detail in the project conversation history, but briefly:
a WebView wrapper reuses 100% of the already-built, already-D-pad-tested
web app. React Native for TV would mean re-implementing every screen, the
whole focus system, and the Supabase Realtime wiring a second time in a
different UI stack for no functional gain. This directory is intentionally
just a shell — if it ever needs to stop being a shell, that's a much bigger
decision than this project's scope.

## Requirements

- **Android Studio** (Iguana/2023.2+ or newer) — this is genuinely the
  easiest way to get this running; it manages the JDK, Android SDK, an
  emulator with a TV device profile, and the Gradle wrapper for you.
- This repo's Next.js app deployed and reachable at the URL
  `MainActivity.kt` loads (`https://www.timewarptrivia.com/tv` by
  default) — or point it at a local dev server (see below) while
  iterating.

## Getting started

1. Open **this `android-tv/` directory** (not the repo root) as its own
   project in Android Studio — `File > Open`.
2. Let Android Studio sync Gradle. **This project's Gradle wrapper
   binaries (`gradlew`, `gradlew.bat`, `gradle-wrapper.jar`) are
   intentionally not checked in** — only `gradle/wrapper/gradle-wrapper.properties`,
   which pins the Gradle version. Android Studio detects the missing
   wrapper and offers to regenerate it automatically; accept that. (If
   you'd rather do it from the CLI with a system Gradle install:
   `gradle wrapper` from this directory.)
3. Android Studio will likely also offer to upgrade the Android Gradle
   Plugin/Kotlin versions pinned in `build.gradle.kts` to whatever it
   currently bundles — accept that too rather than fighting the pinned
   versions here.
4. Create an Android TV emulator (`Device Manager > Create Device >
   Television`, e.g. "Television (1080p)") if you don't have a physical
   Android TV device to deploy to, and run the app.

**This has not been built or run** in the environment this project was
authored in — no Android SDK, Gradle, or emulator was available there.
Every file here was written by hand against the standard Android/Gradle/
Kotlin conventions, not verified by an actual build. Treat the first
Gradle sync in Android Studio as the real first test.

## Pointing at a local dev server while iterating

`MainActivity.kt`'s `appUrl` is a single hardcoded constant — deliberately
not a build-variant/BuildConfig split, since this is a one-screen app and
that would be more machinery than the problem needs. To test against a
local `npm run dev` instead of production, temporarily change it to your
machine's LAN IP (an Android TV emulator can't reach `localhost` on your
host machine) — e.g. `http://192.168.1.23:3000/tv` — and change it back
before committing.

## Offline/error state

If the WebView's main-frame load fails outright (no connection, DNS
failure, 4xx/5xx on `/tv` itself) `MainActivity`'s `WebViewClient` swaps
in a native "Lost the signal" screen — void background, marigold
accent, a single autofocused Retry button — instead of leaving the
WebView's own default error rendering on screen. Retry just reloads
`appUrl`; the WebView stays hidden until a load actually finishes
without erroring, so a Retry that fails again keeps the error screen up
rather than flashing back to a broken WebView. Sub-resource failures
(a font, an image) don't trigger it — only the main document.

## What's deliberately not built

- **No settings screen.** Nothing to configure — the app does one thing.
- **No Play Store listing yet.** `playstore/icon-512.png` is ready for
  one; TIM-10's "set up Google Play developer account" is a manual step
  outside this repo, not something to script.

## Assets

`app/src/main/res/drawable/banner.png` (the Leanback launcher card,
320×180) and every `mipmap-*/ic_launcher*` density were generated from
the web app's own `public/logo.svg` — not hand-designed separately —
so the TV app's icon and the web app's logo can't visually drift apart.
Regenerate them the same way if `logo.svg` ever changes (render the SVG
on the `$void` background at each target size; there's no build-time
pipeline for this, it's a one-off asset export).
