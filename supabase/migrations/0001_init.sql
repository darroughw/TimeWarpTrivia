-- TimeWarp Trivia — initial schema
--
-- Three tables, matching the app's realtime model:
--   rooms   — one row per TV session; `status` drives which screen every
--             connected client renders (mirrors the app's Stage union).
--   players — one row per phone that's joined a room.
--   answers — one row per submitted answer.
--
-- Two columns exist beyond the original brief, both required for the
-- block mechanic (lowest scorer picks one question to answer alone)
-- to actually function over realtime:
--   rooms.blocker_player_id — who is allowed to answer the solo question.
--   answers.room_id         — postgres_changes filters only support simple
--                             column equality, not joins, so answers needs
--                             its own room_id to be filterable by room.
--
-- Question CONTENT is intentionally not a table here — it stays in
-- lib/mockData.ts as shared seed content. `current_question_id` just
-- stores which mock question id is live.

create extension if not exists pgcrypto;

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id text not null,
  status text not null default 'lobby',
  current_round integer,
  current_question_id text,
  blocker_player_id uuid,
  decade_filter text not null default 'all',
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  avatar text not null,
  score integer not null default 0,
  created_at timestamptz not null default now()
);

-- scripts/migrate.mjs replays every migration file on every run (there's
-- no migration-tracking table), so every statement here has to tolerate
-- being re-applied. ADD CONSTRAINT has no IF NOT EXISTS, hence the guard.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rooms_blocker_player_id_fkey'
  ) then
    alter table rooms
      add constraint rooms_blocker_player_id_fkey
      foreign key (blocker_player_id) references players(id) on delete set null;
  end if;
end $$;

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  question_id text not null,
  answer integer not null,
  response_time_ms integer not null,
  created_at timestamptz not null default now(),
  unique (player_id, question_id)
);

create index if not exists players_room_id_idx on players(room_id);
create index if not exists answers_room_id_idx on answers(room_id);
create index if not exists answers_question_id_idx on answers(question_id);

-- RLS ------------------------------------------------------------------
-- No auth layer exists (players join with just a room code), so these
-- policies are intentionally open to the anon role rather than scoped
-- per-room. Anyone with the anon key can read/write any room's data.
-- Fine for a party game with no sensitive data; see README limitations.

alter table rooms enable row level security;
alter table players enable row level security;
alter table answers enable row level security;

drop policy if exists "rooms are publicly readable" on rooms;
create policy "rooms are publicly readable" on rooms for select to anon using (true);
drop policy if exists "rooms are publicly insertable" on rooms;
create policy "rooms are publicly insertable" on rooms for insert to anon with check (true);
drop policy if exists "rooms are publicly updatable" on rooms;
create policy "rooms are publicly updatable" on rooms for update to anon using (true);

drop policy if exists "players are publicly readable" on players;
create policy "players are publicly readable" on players for select to anon using (true);
drop policy if exists "players are publicly insertable" on players;
create policy "players are publicly insertable" on players for insert to anon with check (true);
drop policy if exists "players are publicly updatable" on players;
create policy "players are publicly updatable" on players for update to anon using (true);

drop policy if exists "answers are publicly readable" on answers;
create policy "answers are publicly readable" on answers for select to anon using (true);
drop policy if exists "answers are publicly insertable" on answers;
create policy "answers are publicly insertable" on answers for insert to anon with check (true);

-- RLS policies restrict *rows*; the anon role also needs base table
-- grants to touch these tables at all via the Data API.
grant usage on schema public to anon;
grant select, insert, update on rooms to anon;
grant select, insert, update on players to anon;
grant select, insert on answers to anon;

-- Realtime ---------------------------------------------------------------
-- ADD TABLE has no IF NOT EXISTS either — same replay concern as above.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table rooms;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'answers'
  ) then
    alter publication supabase_realtime add table answers;
  end if;
end $$;
