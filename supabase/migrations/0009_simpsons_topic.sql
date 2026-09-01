-- Registers the "Simpsons" Deep Cuts topic (TIM-41 follow-on) so
-- questions-simpsons-seed.json's deep_cut_topic_id=simpsons rows satisfy
-- questions_deep_cut_topic_id_fkey.

insert into deep_cut_topics (id, label, sort_order, is_active) values
  ('simpsons', 'The Simpsons', 3, true)
on conflict (id) do nothing;
