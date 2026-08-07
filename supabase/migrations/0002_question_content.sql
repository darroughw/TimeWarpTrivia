-- TimeWarp Trivia — question content
--
-- 0001_init.sql deliberately left question content out of the database
-- ("Question content is intentionally not a table here — it stays in
-- lib/mockData.ts"). This migration reverses that: decades, categories,
-- and questions all become real, data-driven tables (TIM-6), so adding a
-- new decade or category is a data change, not a code deploy.
--
-- decades/categories/questions are read-only reference content from the
-- client's perspective — nothing ever writes to them via the app — so
-- they get public SELECT-only policies, no INSERT/UPDATE policies, and
-- are NOT added to the supabase_realtime publication (static content,
-- no live subscription needed).
--
-- rooms gains two nullable columns so the TV and every phone can each
-- independently resolve the same question rows from just an id, the same
-- way current_question_id already works:
--   rooms.block_candidate_ids — the 3 solo-question choices offered to
--     the lowest scorer, picked once at Start Game time (not per-visit
--     to the block stage — there's only ever one block stage per game).
--   rooms.final_question_id — the final question, also picked at Start
--     Game time so decade filtering is consistent across a whole game,
--     but not promoted into current_question_id until the finalQuestion
--     transition actually fires.

create table if not exists decades (
  id text primary key,
  label text not null,
  sort_order integer not null,
  is_active boolean not null default true
);

create table if not exists categories (
  id text primary key,
  label text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  min_decade_id text references decades(id)
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  decade_id text not null references decades(id),
  category_id text not null references categories(id),
  text text not null,
  options text[] not null,
  correct_index integer not null,
  flavor_wrong text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint questions_options_length check (array_length(options, 1) = 4),
  constraint questions_correct_index_range check (correct_index between 0 and 3),
  -- Lets the import script use ON CONFLICT DO NOTHING to stay idempotent.
  unique (decade_id, text)
);

create index if not exists questions_decade_id_idx on questions(decade_id);
create index if not exists questions_category_id_idx on questions(category_id);

alter table rooms add column if not exists block_candidate_ids text[];
alter table rooms add column if not exists final_question_id text;

-- Seed data ---------------------------------------------------------------
-- Small, stable reference rows — safe to embed directly and re-run.
-- The 728 actual trivia questions are NOT seeded here; see
-- scripts/import-questions.mjs (too large to hand-maintain as SQL, and
-- conceptually a one-time data load rather than schema).

insert into decades (id, label, sort_order, is_active) values
  ('80s', '80s', 1, true),
  ('90s', '90s', 2, true),
  ('2000s', '2000s', 3, true),
  ('2010s', '2010s', 4, true)
on conflict (id) do nothing;

insert into categories (id, label, sort_order, is_active, min_decade_id) values
  ('music', 'Music', 1, true, null),
  ('tv', 'TV', 2, true, null),
  ('movies', 'Movies', 3, true, null),
  ('fashion', 'Fashion', 4, true, null),
  ('toys-games', 'Toys & Games', 5, true, null),
  ('advertising-commercials', 'Advertising/Commercials', 6, true, null),
  ('slang-catchphrases', 'Slang/Catchphrases', 7, true, null),
  ('internet-memes', 'Internet Memes/Internet Culture', 8, true, '2000s')
on conflict (id) do nothing;

-- RLS ------------------------------------------------------------------
-- Read-only reference content — no client ever writes to these tables.

alter table decades enable row level security;
alter table categories enable row level security;
alter table questions enable row level security;

drop policy if exists "decades are publicly readable" on decades;
create policy "decades are publicly readable" on decades for select to anon using (true);

drop policy if exists "categories are publicly readable" on categories;
create policy "categories are publicly readable" on categories for select to anon using (true);

drop policy if exists "questions are publicly readable" on questions;
create policy "questions are publicly readable" on questions for select to anon using (true);

grant usage on schema public to anon;
grant select on decades to anon;
grant select on categories to anon;
grant select on questions to anon;
