# TimeWarp Trivia

A decade-hopping party trivia game built for two screens at once: a
big shared display the room plays along with, and a phone controller
everyone answers on. Built with Next.js 14 (App Router, TypeScript),
SCSS, and Supabase (Postgres + Realtime) for the live multiplayer state.

**Play it:** [www.timewarptrivia.com](https://www.timewarptrivia.com)

**Status:** All four routes are wired to a real, provisioned Supabase
project — real rooms, real players, real answers, 1,089 real trivia
questions across 6 decades plus 300 more across 2 Deep Cuts topics
(West Wing, Fallout), synced live over Supabase Realtime. When Supabase
isn't configured (no `NEXT_PUBLIC_SUPABASE_URL`), the host and phone
routes fall back to a scripted demo using `lib/mockData.ts` instead.
See [Current limitations](#current-limitations) for what's still
simplified even in the live path.

## Routes

- **`/`** — the landing page. Explains the game and links to `/host`;
  no room is created until you click through. Static, no Supabase
  dependency.
- **`/host`** — the shared display (TV, laptop, whatever's around).
  Lobby, question, round transition, scoreboard, block, and end-game
  screens, navigable with a D-pad/remote (arrow keys + Enter) for the
  host-paced reveal screens. On load it creates a real room in Supabase
  and subscribes to it over Realtime.
- **`/play`** — the phone controller. Join, waiting, question, answered,
  block-choice, blocked-spectator, and final-results screens, sized for
  touch with 44px+ tap targets. Joining writes a real row to `players`,
  scoped to whatever room code you enter.
- **`/deepcuts`** — a second shared-display mode: pick one open-ended
  topic (West Wing, Fallout) instead of a decade. Its own logo and lobby
  screen (`DeepCutsLobbyScreen`) signal a distinct mode, but it's driven
  by the exact same `LiveTvFlow` game engine as `/host` — only the lobby
  screen and the content-fetch call differ (`mode: "decade" | "deepCuts"`).
  `/play` needs no equivalent second route; joining and answering are
  already fully mode-agnostic.
- **`/tv`** — entry point for the Android TV wrapper (TIM-10): a bare
  intro screen (large logo, one line of copy, an autofocused Start
  button) so launching the packaged app doesn't drop straight into a
  freshly created, playerless `/host` room with nothing on screen to
  explain it. Static, no Supabase dependency — Start just links to
  `/host`, which does the real room creation.

Run the dev server, open `/` and click "Host a Game" (or go straight to
`/host`) on a desktop-sized window, and open `/play` on your phone (or a
second window) — enter the room code shown on the host screen. Every
player join, answer, and state change is real and synced live.

A hidden Konami code (&uarr;&uarr;&darr;&darr;&larr;&rarr;&larr;&rarr;BA)
on `/host` unlocks a portfolio-demo mode (`SimulatorTvFlow`): it fills the
room with fake contestants and lets every stage advance on a keypress
instead of racing real timers, so the whole game — including the block
round and end screen — can be walked through solo. A real phone can still
join the generated code over `/play` and play alongside the fake players.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing
page, [/host](http://localhost:3000/host) for the shared display, and
[/play](http://localhost:3000/play) for the phone controller.

Other scripts:

```bash
npm run build             # production build
npm run start              # serve the production build
npm run lint                # eslint (next/core-web-vitals + next/typescript)
npm run migrate               # apply supabase/migrations/*.sql to POSTGRES_URL_NON_POOLING
npm run import:questions        # one-time load of data/questions-*-seed.json into the questions table
```

`npm run migrate` replays every file in `supabase/migrations/` on every
run (there's no migration-tracking table), so every statement in those
files has to tolerate being re-applied — see the comments in
`supabase/migrations/0001_init.sql` for the idempotency patterns used
(`create table/column if not exists`, guarded `do $$ ... $$` blocks for
things Postgres doesn't support `if not exists` on).

### Environment variables

`lib/supabaseClient.ts` reads `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` — see `.env.local.example`. Without
them, `isSupabaseConfigured` is `false` and the host/phone routes run
the scripted mock flow instead (no crash, just a console warning).

This project is linked to Vercel with the Supabase Marketplace
integration installed, which provisions a real Postgres database and
injects these (plus `POSTGRES_URL_NON_POOLING`, used only by
`npm run migrate`/`npm run import:questions`) automatically. To get
them locally:

```bash
vercel link
vercel env pull   # writes .env.local
npm run migrate            # applies supabase/migrations/ if the DB is fresh
npm run import:questions     # loads the 1,389 seeded questions, if the table is empty
```

PostHog (analytics + heatmaps/session recording) is also provisioned
through the Vercel Marketplace, but its env vars are only attached to
the Production/Preview environments — not Development — since you
generally don't want your own localhost testing polluting real event
data. `app/providers.tsx`/`lib/posthog.ts` no-op cleanly if these
aren't set, so this is optional for local dev:

```bash
vercel env pull .env.local --environment production
```

Sentry (error tracking/performance monitoring) is provisioned the same
way, but its env vars *are* attached to Development, so a normal
`vercel env pull` picks it up.

## Analytics, heatmaps & error tracking

- **Vercel Web Analytics** (`app/layout.tsx`) — pageviews and Web
  Vitals, shows up directly in the Vercel dashboard, zero config beyond
  the `<Analytics />` component.
- **PostHog** (`app/providers.tsx`, `lib/posthog.ts`) — product
  analytics, heatmaps, and session recording. Pageviews are captured
  manually on route change (`PostHogPageView`, using
  `usePathname`/`useSearchParams`) since Next.js App Router navigations
  don't fire a real page load, which is what posthog-js's automatic
  capture relies on. Heatmaps and session recording are project-level
  toggles in the PostHog dashboard, not code — nothing in this repo
  turns them on or off.
- **Custom events** — `room_created`, `decade_selected`,
  `game_started`, `player_joined`, `question_answered`, `block_chosen`,
  `game_ended`, each fired from whichever of `LiveTvFlow`/`LivePlayFlow`
  owns that moment. All client-side, all best-effort (`posthog?.capture`
  — never blocks or throws if PostHog isn't configured).
- **Sentry** (`instrumentation.ts`, `instrumentation-client.ts`,
  `sentry.server.config.ts`, `sentry.edge.config.ts`,
  `app/global-error.tsx`) — catches real runtime errors (failed
  Supabase calls, React errors during realtime state updates, edge
  cases in the round-progression logic) with actual stack traces,
  rather than relying on manual/Playwright testing to surface them.
  Scoped intentionally to error capture + performance tracing only —
  no session replay or feedback widget, since PostHog already covers
  session recording and a floating feedback button isn't something this
  app asked for. `app/global-error.tsx` is deliberately self-contained
  (inline styles, no SCSS modules, no other app code) since it's the
  fallback for when something upstream of the normal layout crashes.

## Data model

Eight tables across eight migrations, all RLS-enabled:

- **`rooms`** (`0001`, extended by `0003`/`0006`/`0008`) — one row per
  hosted session. `status` is the single source of truth for which
  screen every connected client renders — it mirrors the app's
  `RoomStatus` union (`lobby`, `question`, `transition`, `scoreboard`,
  `block`, `soloQuestion`, `soloTransition`, `end`). `question_ids`
  holds the 15 main-round question ids for the whole game in play order
  (round 1 = indices 0-4, round 2 = 5-9, round 3/final = 10-14);
  `question_index` is which of those is currently live — round number
  and the final round's double-points multiplier are both derived from
  that index (`lib/questionService.ts`'s `questionMetaForRoom`), not
  stored separately. Also tracks `current_question_id`,
  `block_candidate_ids` (the 3 solo-question choices),
  `blocker_player_id` (who picked one), `decade_filter` or
  `deep_cut_topic_id` (exactly one is set, mirroring `questions`' own
  either/or), and `asked_question_ids` (`0006` — every question asked
  across a room's whole lifetime, so a same-room Play Again rematch
  doesn't repeat one).
- **`players`** (`0001`, `0004`) — one row per phone that's joined a
  room. `status` (`0004`) is `active` or `left` — a host removing a
  player (TIM-35) doesn't delete the row, it flips this, so their score
  and answers stay intact but they're excluded from block-picker
  selection and active-player counts going forward.
- **`answers`** (`0001`) — one row per submitted answer (unique per
  player+question).
- **`decades`** / **`categories`** / **`questions`** (`0002`, extended
  by `0007`/`0008`) — real, data-driven question content.
  `categories.min_decade_id` gates decade-specific categories (Internet
  Memes only exists for 2000s+) automatically; adding a new decade or
  category is a data change, not a code deploy. `questions.options`/
  `correct_index` are shuffled once at import time
  (`scripts/import-questions.mjs`) — the source JSON in `data/` always
  lists the correct answer first, so the shuffle is what keeps it from
  landing in slot A every time. `0008` makes `decade_id`/`category_id`
  nullable and adds `deep_cut_topic_id`, guarded by a
  `questions_exactly_one_source` check constraint — every question
  belongs to exactly one of a decade or a Deep Cuts topic, never both.
- **`deep_cut_topics`** (`0008`) — one row per open-ended Deep Cuts
  topic (West Wing, Fallout). Public-read, same as `decades`/
  `categories`; topic ids are plain strings rather than a closed
  TypeScript union, so adding a new one is a data change too.
- **`feedback`** (`0005`) — one row per submission from the in-app
  feedback form (TIM-28), publicly insertable, never read back by the
  client.

Scoring is speed-based (`lib/scoring.ts`), doubled on the final round,
computed client-side by whichever phone answers, then written straight
to that player's own `score`.

RLS is enabled on all eight tables. `rooms`/`players`/`answers` have
deliberately open policies for the `anon` role (see `0001`'s comments)
— there's no auth layer, so "open, but documented" was the call.
`decades`/`categories`/`questions`/`deep_cut_topics` are public-read-only
— nothing ever writes to them from the client. `feedback` is
insert-only for `anon`. See limitations below.

## Architecture

The host and phone routes are thin switchers based on
`isSupabaseConfigured`: **live** (real Supabase) or **mock** (scripted,
no backend). `/host` has a third option layered on top — a hidden
**simulator** flow (see [Routes](#routes)) that's still fully live/
Supabase-backed, just paced by keypress instead of real timers.
`/deepcuts` reuses `LiveTvFlow` directly via its `mode` prop rather than
being a fourth flow of its own:

```
instrumentation.ts                       # Sentry server/edge registration (Next.js convention, project root)
instrumentation-client.ts                  # Sentry client init (Next.js convention, project root)
sentry.server.config.ts                      # Sentry server runtime config
sentry.edge.config.ts                          # Sentry edge runtime config
app/
  page.tsx                    # landing page (static, no Supabase dependency)
  host/page.tsx                  # shared-display route switcher (live/mock/simulator)
  play/page.tsx                    # phone route switcher
  deepcuts/page.tsx                  # Deep Cuts shared-display route (LiveTvFlow, mode="deepCuts")
  tv/page.tsx                          # Android TV wrapper entry point — intro screen, links to /host
  providers.tsx                      # PostHog init + pageview-on-route-change
  global-error.tsx                     # Sentry-reporting fallback for a crashed root layout
  _game/
    LiveTvFlow.tsx                    # real room/Realtime-driven host flow (decade + Deep Cuts)
    MockTvFlow.tsx                      # scripted demo host flow (no backend)
    SimulatorTvFlow.tsx                   # Konami-code demo: real room, fake players, keypress-paced
    LivePlayFlow.tsx                        # real join/Realtime-driven phone flow
    MockPlayFlow.tsx                          # scripted demo phone flow (no backend)
  styles/                                       # shared SCSS tokens/mixins/globals
components/
  tv/                    # one component per shared-display screen (+ shared bits)
  phone/                 # one component per phone screen
  shared/                # cross-cutting, non-screen UI — loading state, small-screen notice,
                          # illustrated Help modal (TIM-39), feedback form (TIM-28)
hooks/
  useDpadNavigation.ts        # arrow-key + Tab focus movement/trap for the host routes
  useRoomRealtime.ts             # subscribes a room id to live rooms+players
  useRoomAnswers.ts                 # subscribes a room id to live answers (shared by Live/SimulatorTvFlow)
  useCurrentQuestion.ts               # resolves current_question_id into a full Question
  useBlockCandidates.ts                 # resolves block_candidate_ids into 3 Questions
  useCountdown.ts                         # shared per-second tick, used by both QuestionScreens
  useDecadeTheme.ts                         # applies a decade's accent theme for the session (TIM-14)
  useIsLargeScreen.ts                         # TV vs. phone viewport check, gates SmallScreenNotice
  useKonamiCode.ts                              # listens for the simulator-mode unlock sequence
lib/
  types.ts                  # shared domain types (+ OPTION_LETTERS)
  database.types.ts            # Supabase row types + RoomStatus
  mockData.ts                     # hardcoded players/questions/rounds (scripted-demo + simulator seed data)
  questionService.ts                 # decades/questions/Deep Cuts topics queries — fetch, random-pick, meta-by-id
  roomService.ts                        # create/join/update-room/submit-answer
  scoring.ts                               # speed-based point calculation (+ final-round multiplier)
  decadeColors.ts                             # per-decade accent color map
  deepCutColors.ts                              # per-topic accent color map (Deep Cuts equivalent)
  helpContent.ts                                  # copy for the illustrated Help modal (TIM-39)
  feedbackService.ts                                # writes to the feedback table (TIM-28)
  avatar.ts                                      # deterministic emoji/color from a name
  supabaseClient.ts                                 # Supabase client + isSupabaseConfigured
  posthog.ts                                           # PostHog env vars + isPostHogConfigured
data/
  questions-{60s,70s,80s,90s,2000s,2010s}-seed.json   # 1,089 fact-checked decade questions, source of truth
  questions-{west-wing,fallout}-seed.json                # 300 more, source of truth for Deep Cuts topics
supabase/migrations/
  0001_init.sql                                          # rooms/players/answers + RLS + Realtime
  0002_question_content.sql                                 # decades/categories/questions + RLS
  0003_round_structure.sql                                    # rooms.question_ids/question_index
  0004_player_status.sql                                        # players.status (active/left, TIM-35)
  0005_feedback.sql                                               # feedback table (TIM-28)
  0006_rematch.sql                                                  # rooms.asked_question_ids (TIM-38)
  0007_sixties_seventies.sql                                          # 60s/70s decades + content (TIM-42)
  0008_deep_cuts.sql                                                    # deep_cut_topics + questions'/rooms' either/or columns (TIM-41)
scripts/
  migrate.mjs                                                    # applies supabase/migrations/*.sql
  import-questions.mjs                                              # loads data/*.json into questions
```

Every screen component (`components/tv/*`, `components/phone/*`) is
shared across the live, mock, and simulator flows alike — only the flow
controllers differ in where the data comes from.

## The round structure

3 rounds of 5 questions each, picked once (18 questions total — 15 main
+ 3 block candidates) when the host clicks Start Game, respecting the
lobby's decade filter. The 3rd round is Double Points — the live
countdown timer shows the actual point value decaying in real time
(e.g. 400 → 200 instead of the normal 200 → 50), not just the seconds
left.

## The block mechanic

Before the final round, the lowest-scoring player picks one specific
question (not a rival, not a category) to answer alone — this happens
exactly once per game, between round 2's scoreboard and round 3:

- That question gets shown to everyone — the shared display shows it
  like any other question.
- Only the picker gets answer controls; everyone else's phone shows
  the read-only `BlockedSpectatorScreen`.
- The picker scores normally (1x, not doubled) if they're correct;
  nobody else can score on that question.

In the live flow this is a real cross-device handoff: the phone
BlockChoiceScreen writes `current_question_id` + `blocker_player_id` +
`status: "soloQuestion"` straight to the room row, and the shared
display — a completely separate client — picks that up over Realtime
with no polling and updates automatically.

## Design system

Shared tokens live in `app/styles/_theme.scss` and are pulled into
every component's `.module.scss` via `@use "theme" as *;`:

- **Type** — `$paper-font` (Archivo, body/UI), `$head-font` (Archivo
  Black, marquee headlines), `$mono-font` (Space Mono, timers/scores/room
  codes). Loaded as Google Fonts in `app/layout.tsx` via `next/font`.
- **Color** — a dark "broadcast void" palette (`$void`, `$paper`) with
  marigold/coral/teal accents, plus a per-decade accent map in
  `lib/decadeColors.ts` (60s/70s/80s/90s/2000s/2010s each get their own hue,
  chosen to clear WCAG AA contrast against the dark `$ink` text used on
  top of them).
- **Shared mixins** (`app/styles/_mixins.scss`) — `dpad-focusable` (TV
  remote focus ring, kept visually distinct from the marigold "selected"
  fill so focus and selection never read as the same state — see
  `$focus-ring-color` in `_theme.scss`), `tappable` (phone touch-target +
  press feedback), `marquee-heading`, `mono-figure`, `visually-hidden`
  (screen-reader-only live-region text), and the ambient CRT
  `scanline-overlay` signature used on every screen.

`next.config.mjs` adds `app/styles` to the Sass `includePaths`, so any
component can `@use "theme" as *;` / `@use "mixins" as *;` without a
relative path.

## Current limitations

- **Scoring is client-trusted.** Each phone computes its own score and
  writes it directly — there's no server-side validation. Fine for a
  casual party game, not fine if this ever needs to resist cheating.
- **RLS is open on `rooms`/`players`/`answers`, not per-room.** Anyone
  with the anon key can read or write any room's data — there's no auth
  layer to scope policies against. See `0001`'s comments for the
  reasoning. `decades`/`categories`/`questions` are read-only for
  everyone, which sidesteps the same concern for content.
- **Response timing is client-clock-based.** `response_time_ms` is
  measured from when a phone *observes* the question over Realtime to
  when it taps an answer — not a server timestamp, so it's sensitive to
  each device's network latency.
- **One host session per room, no reconnect handling.** If the host tab
  reloads mid-game, it creates a brand-new room rather than resuming
  the one it had — there's no session persistence for the host.
- **Play Again reuses the room/code; Cancel Game doesn't (TIM-38).**
  Play Again resets the *same* room back to `lobby` — everyone's already-
  connected phone picks that up over Realtime with nothing to re-enter.
  Cancel Game is the one that mints a brand-new room/code, and existing
  phone sessions aren't notified when a host does that — players would
  have to rejoin manually with the new code.
- **Category selection is fully random**, not per-round. CLAUDE.md's
  spec calls for categories to rotate per round; `categories` rows and
  `min_decade_id` gating exist, but nothing queries by category yet —
  a round's 5 questions are drawn at random from the whole decade-
  filtered pool.
- **D-pad arrow keys move focus, not selection, on the decade filter.**
  `DecadeFilter` is a real `role="radiogroup"`/`role="radio"` widget,
  but `useDpadNavigation` treats it as just another set of focusable
  elements in the screen's flat arrow-key tab order — arrowing past the
  last pill jumps focus to the Start Game button rather than wrapping
  within the group. Matches how Android TV/leanback radio-style
  selectors already require an explicit "OK" press to activate, so it's
  probably fine for the real target platform's assistive tech, but
  hasn't been verified against real TalkBack/remote hardware.
