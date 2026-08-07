-- TimeWarp Trivia — real round structure
--
-- Previously the live game only ever showed one question per stage —
-- current_question_id pointed at a single mock/random question, and
-- final_question_id at a single separate "final" one. This migration
-- replaces that with the actual spec: 3 rounds of 5 questions each,
-- with the 3rd round scored at 2x (see lib/scoring.ts and
-- lib/questionService.ts's questionMetaForRoom).
--
-- question_ids holds all 15 main-round question ids in play order:
-- round 1 is indices 0-4, round 2 is 5-9, round 3 (final, double
-- points) is 10-14. question_index is which of those 15 is currently
-- live. Round number is deliberately NOT stored separately — it's
-- always Math.floor(question_index / 5) + 1, computed in one place,
-- rather than kept in sync as a second column.
--
-- final_question_id is dropped — round 3 is just more question_ids
-- entries now, not a structurally separate question.
--
-- current_round is dropped too — it was never read anywhere, only
-- written, and duplicating the round number in a second column risks
-- drift now that it actually matters for scoring.

alter table rooms drop column if exists final_question_id;
alter table rooms drop column if exists current_round;
alter table rooms add column if not exists question_ids text[];
alter table rooms add column if not exists question_index integer;
