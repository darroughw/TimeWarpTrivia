# TimeWarp Trivia

A decade-hopping party trivia game built for two screens at once: a
10-foot TV display the room plays along with, and a phone controller
everyone answers on. Built with Next.js 14 (App Router, TypeScript) and
SCSS, with Supabase slated as the realtime backend.

**Status:** UI-only. Both routes run entirely on mock/hardcoded data —
there's no live Supabase wiring yet, no room persistence, and no
realtime sync between the TV and the phones. See [Current limitations](#current-limitations).

## Routes

- **`/`** — the TV display. Lobby, question, round transition, block,
  scoreboard, and end-game screens, navigable with a D-pad/remote (arrow
  keys + Enter). Auto-advances through a scripted demo round on load.
- **`/play`** — the phone controller. Join, waiting, question, answered,
  block-choice, blocked-spectator, and final-results screens, sized for
  touch with 44px+ tap targets.

Run the dev server and open both routes side by side (e.g. `/` on a
desktop-sized window, `/play` in a mobile viewport or on your phone via
your machine's LAN IP) to see them together — they aren't wired to share
state yet, so each runs its own scripted mock flow independently.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # optional for now — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the TV view and
[http://localhost:3000/play](http://localhost:3000/play) for the phone
controller.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint (next/core-web-vitals + next/typescript)
```

### Environment variables

`lib/supabaseClient.ts` reads `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local.example`). Nothing
currently imports this client, so the app runs fine without a
`.env.local` — it's there for when real data gets wired up.

## Design system

Shared tokens live in `app/styles/_theme.scss` and are pulled into every
component's `.module.scss` via `@use "theme" as *;`:

- **Type** — `$paper-font` (Archivo, body/UI), `$head-font` (Archivo
  Black, marquee headlines), `$mono-font` (Space Mono, timers/scores/room
  codes). Loaded as Google Fonts in `app/layout.tsx` via `next/font`.
- **Color** — a dark "broadcast void" palette (`$void`, `$paper`) with
  marigold/coral/teal accents, plus a per-decade accent map in
  `lib/decadeColors.ts` (80s/90s/2000s/2010s each get their own hue).
- **Shared mixins** (`app/styles/_mixins.scss`) — `dpad-focusable` (TV
  remote focus ring), `tappable` (phone touch-target + press feedback),
  `marquee-heading`, `mono-figure`, and the ambient CRT `scanline-overlay`
  signature used on every screen.

`next.config.mjs` adds `app/styles` to the Sass `includePaths`, so any
component can `@use "theme" as *;` / `@use "mixins" as *;` without a
relative path.

## Project structure

```
app/
  layout.tsx          # fonts, global metadata
  page.tsx             # TV route — stage machine + mock game flow
  play/page.tsx         # Phone route — stage machine + mock game flow
  styles/                # shared SCSS tokens/mixins/globals
components/
  tv/                    # one component per TV screen (+ shared bits)
  phone/                 # one component per phone screen
hooks/
  useDpadNavigation.ts   # arrow-key focus movement for the TV routes
lib/
  types.ts               # shared domain types
  mockData.ts             # hardcoded players/questions/rounds
  decadeColors.ts          # per-decade accent color map
  avatar.ts                 # deterministic emoji/color from a name
  supabaseClient.ts          # Supabase client (unused until wired up)
```

## Current limitations

- **No Supabase wiring.** Both routes use `lib/mockData.ts`; nothing
  reads or writes a real room, player, or question.
- **TV and phone don't sync.** Each route runs its own local, scripted
  demo sequence — starting the TV game doesn't do anything on a phone,
  and vice versa.
- **The "block" mechanic differs between routes.** The TV's block screen
  has the lowest scorer pick a *rival player* to block from scoring; the
  phone's block-choice screen has them veto a *question category*
  instead. These need to converge on one real rule before real data gets
  wired in.
