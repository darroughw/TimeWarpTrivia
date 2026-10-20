-- Registers the "RuPaul's Drag Race" Deep Cuts topic (TIM-41 follow-on,
-- user-requested) so questions-drag-race-seed.json's
-- deep_cut_topic_id=drag-race rows satisfy questions_deep_cut_topic_id_fkey.

insert into deep_cut_topics (id, label, sort_order, is_active) values
  ('drag-race', 'RuPaul''s Drag Race', 4, true)
on conflict (id) do nothing;
