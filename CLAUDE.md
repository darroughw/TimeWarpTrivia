# TimeWarp Trivia — notes for Claude

Party trivia: one shared TV screen hosts, everyone else plays from their
phone. `README.md` covers routes, data model, and architecture in depth.

## What lives where

- **Web app (Next.js 14, SCSS modules):** TV screens in `components/tv/`,
  phone controller screens in `components/phone/` (served at `/play`),
  game state machines in `app/_game/` (`LiveTvFlow.tsx`, `LivePlayFlow.tsx`,
  plus mock flows used when Supabase isn't configured).
- **Apple TV app:** native SwiftUI in `apple-tv/` — see `apple-tv/CLAUDE.md`.
  It is a port of the web TV screens; keep gameplay in parity.
- **Android TV app:** a WebView wrapper around the web `/tv` route, in
  `android-tv/`.
- **Backend:** Supabase (`supabase/`). The web app, the phones, and the
  Apple TV app all talk to the **same production project** — avoid
  creating test rooms or players there; use the mock flows / Apple TV demo
  mode instead.

## Running the phone controller without a backend

`app/play` falls back to the scripted `MockPlayFlow` when Supabase env vars
are empty, which walks every phone screen with sample data:

```
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev
```

then open `/play` at phone width (≈390×844).

## Shared design tokens

- Tokens live in `app/styles/_theme.scss`; the Apple TV app mirrors them
  in `apple-tv/TimeWarpTrivia/Theme/Colors.swift`. Change both together.
- `$marigold` and the `$void*` surfaces are CSS-variable-backed so mode
  themes can override them (`_decade-themes.scss`): the decade themes
  re-tint the accent; Deep Cuts' `[data-deep-cuts-theme]` (set by
  `hooks/useDeepCutsTheme.ts` on `/deepcuts` and on phones in a Deep Cuts
  room) also darkens the surfaces to violet. The web Deep Cuts lobby
  shares `LobbyScreen.module.scss` with the decade lobby.
- Coral = wrong/urgent and teal = correct are fixed and never themed.
- `$option-colors` are the A/B/C/D answer colors, used on the phone and
  the Apple TV. They deliberately avoid teal/coral.
- Animations respect `prefers-reduced-motion` (web) and Reduce Motion
  (tvOS), and animate only transform/opacity.

## Checks before committing

`npx tsc --noEmit`, `npm run lint`, and `npm run build` for web changes;
an Xcode build for Apple TV changes.
