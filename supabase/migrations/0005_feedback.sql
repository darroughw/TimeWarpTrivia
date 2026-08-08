-- TimeWarp Trivia — feedback / category suggestions (TIM-28)
--
-- Landing-page-only for now, per the issue's own placement decision —
-- no post-game prompt. Write-only from the client's side: unlike
-- rooms/players/answers (which anon also needs to *read* for realtime
-- gameplay to work at all), nothing in the app ever needs to read
-- feedback back, so anon gets INSERT only. Reading it back is a
-- Supabase-dashboard/service-role job.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  category_suggestion text,
  email text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

drop policy if exists "feedback is publicly insertable" on feedback;
create policy "feedback is publicly insertable" on feedback for insert to anon with check (true);

grant usage on schema public to anon;
grant insert on feedback to anon;
