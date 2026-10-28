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
- Barrio (the logo's face; `$title-font` / `TWTFont.title`) is only for
  the "TimeWarp Trivia" wordmark, the "Round N" countdown title, and
  "Final Results". Every other heading uses Archivo Black.
- `$option-colors` are the A/B/C/D answer colors, used on the phone and
  the Apple TV. They deliberately avoid teal/coral.
- Animations respect `prefers-reduced-motion` (web) and Reduce Motion
  (tvOS), and animate only transform/opacity.

## Player characters

24 characters (robots, monsters, aliens, people) designed in the Figma
file's "Player Characters" page, exported to `public/characters/<id>.svg`
and the Apple TV asset catalog (`Assets.xcassets/Characters`). Players
pick one on the phone's join screen (`components/phone/CharacterPicker`).
**`players.avatar` still stores an emoji, never a character id**: each
character is identified by its emoji (`lib/characters.ts`, mirrored in
`apple-tv/.../Services/PlayerCharacter.swift`). Older Apple TV builds in
the App Store render that column as text, so they keep showing the emoji;
anything that isn't a character emoji renders as the emoji itself. Never
reuse or reorder an emoji in that table — it would change existing
players' characters. Characters are black-and-white line art drawn on a
circle filled with the player's color.

## Checks before committing

`npx tsc --noEmit`, `npm run lint`, and `npm run build` for web changes;
an Xcode build for Apple TV changes.
