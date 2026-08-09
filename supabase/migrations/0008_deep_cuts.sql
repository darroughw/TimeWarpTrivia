-- TIM-41 — "Deep Cuts" mode: topic-based games as an alternative to
-- decade selection. A room is one mode or the other, never both; a
-- question belongs to exactly one of decade_id / deep_cut_topic_id.
--
-- Note: 0002_question_content.sql's category_id was written as NOT
-- NULL despite the product spec describing it as nullable — this
-- migration is what actually makes that true, since Deep Cuts
-- questions have no category (the topic itself is the category).

create table if not exists deep_cut_topics (
  id text primary key,
  label text not null,
  sort_order integer not null,
  is_active boolean not null default true
);

alter table questions alter column decade_id drop not null;
alter table questions alter column category_id drop not null;
alter table questions add column if not exists deep_cut_topic_id text references deep_cut_topics(id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'questions_exactly_one_source'
  ) then
    alter table questions add constraint questions_exactly_one_source check (
      (decade_id is not null and deep_cut_topic_id is null) or
      (decade_id is null and deep_cut_topic_id is not null)
    );
  end if;
end $$;

-- The existing unique(decade_id, text) only dedupes decade-mode rows
-- (nulls never conflict with each other in Postgres uniqueness), so
-- deep-cuts rows need their own equivalent constraint for the import
-- script's ON CONFLICT DO NOTHING to work.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'questions_deep_cut_topic_id_text_key'
  ) then
    alter table questions add constraint questions_deep_cut_topic_id_text_key unique (deep_cut_topic_id, text);
  end if;
end $$;

create index if not exists questions_deep_cut_topic_id_idx on questions(deep_cut_topic_id);

alter table rooms add column if not exists deep_cut_topic_id text references deep_cut_topics(id);

insert into deep_cut_topics (id, label, sort_order, is_active) values
  ('west-wing', 'The West Wing', 1, true),
  ('fallout', 'Fallout', 2, true)
on conflict (id) do nothing;

alter table deep_cut_topics enable row level security;
drop policy if exists "deep_cut_topics are publicly readable" on deep_cut_topics;
create policy "deep_cut_topics are publicly readable" on deep_cut_topics for select to anon using (true);
grant select on deep_cut_topics to anon;
