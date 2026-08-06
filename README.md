# TimeWarp Trivia

A decade-hopping party trivia game built for two screens at once: a
10-foot TV display the room plays along with, and a phone controller
everyone answers on. Built with Next.js 14 (App Router, TypeScript),
SCSS, and Supabase (Postgres + Realtime) for the live multiplayer state.

**Status:** Both routes are wired to a real, provisioned Supabase
project — real rooms, real players, real answers, synced live over
Supabase Realtime. When Supabase isn't configured (no
`NEXT_PUBLIC_SUPABASE_URL`), both routes fall back to a scripted demo
using `lib/mockData.ts` instead. See [Current limitations](#current-limitations)
for what's still simplified even in the live path.

## Routes

- **`/`** — the TV display. Lobby, question, round transition, block,
  scoreboard, and end-game screens, navigable with a D-pad/remote (arrow
  keys + Enter) for the host-paced reveal screens. On load it creates a
  real room in Supabase and subscribes to it over Realtime.
- **`/play`** — the phone controller. Join, waiting, question, answered,
  block-choice, blocked-spectator, and final-results screens, sized for
  touch with 44px+ tap targets. Joining writes a real row to `players`,
  scoped to whatever room code you enter.

Run the dev server, open `/` on a desktop-sized window, and open `/play`
on your phone (or a second window) — enter the room code shown on the
TV. Every player join, answer, and state change is real and synced live;
this isn't two independently-scripted demos anymore.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the TV view and
[http://localhost:3000/play](http://localhost:3000/play) for the phone
controller.

Other scripts:

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint      # eslint (next/core-web-vitals + next/typescript)
npm run migrate   # apply supabase/migrations/*.sql to POSTGRES_URL_NON_POOLING
```

### Environment variables

`lib/supabaseClient.ts` reads `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` — see `.env.local.example`. Without
them, `isSupabaseConfigured` is `false` and both routes run the
scripted mock flow instead (no crash, just a console warning).

This project is linked to Vercel with the Supabase Marketplace
integration installed, which provisions a real Postgres database and
injects these (plus `POSTGRES_URL_NON_POOLING`, used only by
`npm run migrate`) automatically. To get them locally:

```bash
vercel link
vercel env pull   # writes .env.local
npm run migrate   # applies supabase/migrations/ if the DB is fresh
```

## Data model

Three tables (`supabase/migrations/0001_init.sql`), all Realtime-enabled:

- **`rooms`** — one row per TV session. `status` is the single source of
  truth for which screen every connected client renders — it mirrors
  the app's `RoomStatus` union (`lobby`, `question`, `transition`,
  `scoreboard`, `block`, `soloQuestion`, `soloTransition`,
  `finalQuestion`, `finalTransition`, `end`). Also tracks
  `current_question_id`, `blocker_player_id` (who picked the solo
  question), and `decade_filter`.
- **`players`** — one row per phone that's joined a room.
- **`answers`** — one row per submitted answer (unique per player+question).

Question *content* is intentionally not a table — it stays in
`lib/mockData.ts` as shared seed content (`QUESTION_BANK` /
`getQuestionById`), and `rooms.current_question_id` just stores which
mock question id is currently live. Scoring is speed-based
(`lib/scoring.ts`) and computed client-side by whichever phone
answers, then written straight to that player's own `score`.

RLS is enabled on all three tables with deliberately open policies for
the `anon` role (see the migration's comments) — there's no auth layer,
so "open, but documented" was the call. See limitations below.

## Architecture

Both routes are thin switchers between a **live** flow and a **mock**
flow, based on `isSupabaseConfigured`:

```
app/
  page.tsx              # TV route switcher
  play/page.tsx           # Phone route switcher
  _game/
    LiveTvFlow.tsx          # real room/Realtime-driven TV flow
    MockTvFlow.tsx           # scripted demo TV flow (no backend)
    LivePlayFlow.tsx          # real join/Realtime-driven phone flow
    MockPlayFlow.tsx           # scripted demo phone flow (no backend)
  styles/                       # shared SCSS tokens/mixins/globals
components/
  tv/                    # one component per TV screen (+ shared bits)
  phone/                 # one component per phone screen
  shared/                # cross-cutting, non-screen UI (loading state)
hooks/
  useDpadNavigation.ts   # arrow-key focus movement for the TV routes
  useRoomRealtime.ts       # subscribes a room id to live rooms+players
lib/
  types.ts                 # shared domain types
  database.types.ts          # Supabase row types + RoomStatus
  mockData.ts                  # hardcoded players/questions/rounds (seed data)
  roomService.ts                 # create/join/update-room/submit-answer
  scoring.ts                       # speed-based point calculation
  decadeColors.ts                    # per-decade accent color map
  avatar.ts                            # deterministic emoji/color from a name
  supabaseClient.ts                      # Supabase client + isSupabaseConfigured
supabase/migrations/
  0001_init.sql                            # rooms/players/answers + RLS + Realtime
scripts/
  migrate.mjs                                # applies supabase/migrations/*.sql
```

Every screen component (`components/tv/*`, `components/phone/*`) is
shared between the live and mock flows — only the flow controllers
differ in where the data comes from.

## The block mechanic

Before the final round, the lowest-scoring player picks one specific
question (not a rival, not a category) to answer alone:

- That question gets shown to everyone — the TV displays it like any
  other question.
- Only the picker gets answer controls; everyone else's phone shows
  the read-only `BlockedSpectatorScreen`.
- The picker scores normally if they're correct; nobody else can score
  on that question.

In the live flow this is a real cross-device handoff: the phone
BlockChoiceScreen writes `current_question_id` + `blocker_player_id` +
`status: "soloQuestion"` straight to the room row, and the TV — a
completely separate client — picks that up over Realtime with no
polling and updates automatically.

## Design system

Shared tokens live in `app/styles/_theme.scss` and are pulled into
every component's `.module.scss` via `@use "theme" as *;`:

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

## Current limitations

- **Scoring is client-trusted.** Each phone computes its own score and
  writes it directly — there's no server-side validation. Fine for a
  casual party game, not fine if this ever needs to resist cheating.
- **RLS is open, not per-room.** Anyone with the anon key can read or
  write any room's data — there's no auth layer to scope policies
  against. See the migration's comments for the reasoning.
- **Response timing is client-clock-based.** `response_time_ms` is
  measured from when a phone *observes* the question over Realtime to
  when it taps an answer — not a server timestamp, so it's sensitive to
  each device's network latency.
- **One TV per room, no reconnect handling.** If the TV tab reloads
  mid-game, it creates a brand-new room rather than resuming the one it
  had — there's no session persistence for the host.
- **Play Again always starts a new room/code.** Existing phone sessions
  aren't notified when the TV does this — players rejoin manually with
  the new code.
- **Only one question per stage exists.** There's a single Round 3
  question, three solo-round candidates, and one final question — no
  real question bank or round-generation logic, live or mocked.
- **`decade_filter` is recorded but unused.** The lobby's decade
  selector persists to the room row, but nothing branches on it yet —
  there's only one question pool, not one per decade.
