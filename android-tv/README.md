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

## Signing / building a release bundle

Release builds (`.aab`, for Play Console or Amazon Appstore) are signed
via `app/build.gradle.kts` reading credentials from `keystore.properties`
in this directory — that file is gitignored and never committed, since it
holds the keystore path and its password in plaintext. Without it,
`bundleRelease` still configures and runs, it just produces an **unsigned**
bundle (no `signingConfig` gets attached to the `release` build type).

To generate a new upload key (only do this once per app — whatever key
signs the first uploaded bundle is the one needed for every future update
under this app's identity):

```sh
keytool -genkeypair -v \
  -keystore ~/.android-keystores/timewarptrivia-release-upload.jks \
  -alias timewarptrivia-upload \
  -keyalg RSA -keysize 2048 -validity 10950 \
  -dname "CN=TimeWarp Trivia, OU=Development, O=TimeWarp Trivia, L=Unknown, ST=Unknown, C=US"
```

Deliberately generated **outside** this repo (`~/.android-keystores/`,
not `android-tv/`) so a `.gitignore` mistake can't accidentally leak it.
Modern `keytool` defaults to a PKCS12 keystore, which only supports one
password for both the store and the key — use the same value for both
prompts. Then create `android-tv/keystore.properties` (not committed):

```properties
storeFile=/absolute/path/to/timewarptrivia-release-upload.jks
storePassword=...
keyAlias=timewarptrivia-upload
keyPassword=...
```

**Back up the `.jks` file and its password somewhere durable (a password
manager, not just this disk)** — there's no "reset" for a lost upload key
short of Play Console's key-loss recovery process, and Amazon has no
equivalent at all. Then build with:

```sh
./gradlew bundleRelease
```

Output lands at `app/build/outputs/bundle/release/app-release.aab`.
Sanity-check the signature independent of Gradle with
`jarsigner -verify -certs app/build/outputs/bundle/release/app-release.aab`
(expect `jar verified.`, plus a benign self-signed-certificate warning —
upload keys are always self-signed).

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

## Fire TV / Amazon Appstore (TIM-43)

Amazon Fire TV runs Android, and this wrapper already targets it without
changes: no Google Play Services calls anywhere in `MainActivity.kt`, and
`AndroidManifest.xml` already declares `android.software.leanback` as
required and `android.hardware.touchscreen` as not required — exactly
what [Amazon's manifest compatibility check](https://developer.amazon.com/docs/app-submission/troubleshooting-android-manifest-and-device-targeting.html)
and [Fire TV app guidelines](https://developer.amazon.com/docs/fire-tv/submitting-your-app-to-the-amazon-appstore.html)
look for. The same APK this project builds for Google Play should install
and run on Fire TV as-is; this hasn't been verified against real Fire TV
hardware or the Fire TV emulator (Amazon Developer Console's built-in
device farm, or a physical Fire TV stick in developer mode), which is the
first real test, same caveat as the "not built or run" note above.

### Store assets

`store-assets/fire-tv/` has everything Amazon's submission form asks for
as an app-specific asset:

- `app-icon-1280x720.png` — the Fire TV launcher tile.
- `background-1920x1080.png` / `featured-content-background-1920x720.png`
  — atmosphere art for the app's details page and editorial-feature
  placement. Deliberately text-light: Fire TV overlays its own
  title/description on top, usually bottom-left, so that corner is kept
  clear and the logo watermark sits off to the right instead.
- `featured-content-logo-640x260.png` — transparent-background logo
  lockup for featured placement.
- `screenshot-1-intro.png` through `screenshot-5-final-results.png` — five
  1920×1080 shots (intro, lobby, a live question, the scoreboard, final
  results) covering the "at least 3" requirement with real variety.
- `testing-instructions.txt` — paste-ready text for Amazon's submission
  form field of the same name, walking a reviewer through hosting a game
  on the TV and joining as a player from a second browser (there's no
  login/account anywhere in the app to explain). Deliberately doesn't
  mention the Konami-code demo simulator (`SimulatorTvFlow`) — it needs
  literal "b"/"a" keydowns that a stock Fire TV remote has no way to send.
- `short-description.txt` / `long-description.txt` — store-listing copy,
  under Amazon's 1200/4000-character caps respectively.

All of it — icon, backgrounds, and screenshots alike — was generated the
same way as `banner.png`/`icon-512.png` already were (render `logo.svg`
on the `$void` background at the target size), plus one more trick for
the screenshots: they're headless-Chrome captures of `/tv` and `/host`
running in **mock/demo mode** (`MockTvFlow` — the same no-backend, scripted
flow that renders when `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
aren't set) at a 1920×1080 viewport, not captures from actual Fire TV
hardware. Since the WebView renders the exact same web app either way,
these are representative of the real product, not mockups — but if
Amazon's reviewers want hardware-sourced screenshots specifically,
recapture from a real device or the Fire TV emulator instead.

Still missing for an actual Amazon Appstore submission — separate from
the app and its assets, same shape as the Play Store gap above:

- **Amazon developer account.** Free signup at
  [developer.amazon.com](https://developer.amazon.com/), same email as
  any Amazon account works — no separate hardware needed to create the
  account itself, only to test the built APK on real Fire TV hardware.
- **Small icon, 114×114 PNG.** `playstore/icon-512.png` (512×512) covers
  Amazon's "large icon" requirement as-is; the 114×114 size still needs
  generating from the same source.
- Pass through [Amazon's App Testing criteria](https://developer.amazon.com/docs/app-testing/test-criteria.html)
  before submission — largely the same bar as Play Store review, plus
  Fire TV's remote-only input model, which this app already satisfies
  (no touch/mouse dependency anywhere in `MainActivity.kt`).

Per TIM-43, this is a stretch goal sequenced after Android TV/Play Store
ships — not blocking, but unblocked independently of the Play Store
developer account, since Amazon's account signup doesn't require a phone.

## Assets

`app/src/main/res/drawable/banner.png` (the Leanback launcher card,
320×180) and every `mipmap-*/ic_launcher*` density were generated from
the web app's own `public/logo.svg` — not hand-designed separately —
so the TV app's icon and the web app's logo can't visually drift apart.
Regenerate them the same way if `logo.svg` ever changes (render the SVG
on the `$void` background at each target size; there's no build-time
pipeline for this, it's a one-off asset export).
