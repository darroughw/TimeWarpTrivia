-- Add 60s and 70s as playable decades, plus the new categories their
-- content introduces (TIM-42). Negative sort_order keeps them
-- chronologically first without renumbering the existing 80s=1..2010s=4
-- rows. min_decade_id on space-race is metadata only today — nothing in
-- the app currently reads categories/min_decade_id at runtime (see
-- questionService.fetchRandomQuestionSet, which filters by decade only).
insert into decades (id, label, sort_order, is_active) values
  ('60s', '60s', -2, true),
  ('70s', '70s', -1, true)
on conflict (id) do nothing;

insert into categories (id, label, sort_order, is_active, min_decade_id) values
  ('sports', 'Sports', 9, true, null),
  ('news-events', 'News & Events', 10, true, null),
  ('celebrities', 'Celebrities', 11, true, null),
  ('space-race', 'Space Race', 12, true, '60s')
on conflict (id) do nothing;
