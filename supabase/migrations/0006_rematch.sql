-- TIM-38 — same-room rematch support.
--
-- asked_question_ids accumulates every question id (main + block
-- candidates) ever surfaced in this room across every rematch, so a new
-- game can steer away from repeats where the decade pool allows it (see
-- lib/questionService.fetchRandomQuestionSet).
alter table rooms add column if not exists asked_question_ids text[] not null default '{}';

-- Play Again clears the room's answers: scores already live on
-- players.score (not derived from answers), so historical answer rows
-- serve no purpose after a rematch starts, and leaving them risks a
-- unique-constraint collision if a question ever repeats via the
-- pool-exhaustion fallback in fetchRandomQuestionSet.
drop policy if exists "answers are publicly deletable" on answers;
create policy "answers are publicly deletable" on answers for delete to anon using (true);
grant delete on answers to anon;
