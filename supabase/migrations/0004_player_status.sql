-- TIM-34 / TIM-35 — players need a way to be excluded from "who's still
-- playing" logic (the block-picker's lowest-scorer lookup, most
-- critically) without deleting their row — their score and answer
-- history stay intact either way.
--
-- No automatic disconnect detection here (Realtime presence, heartbeats)
-- — status is only ever set by an explicit write: the host removing a
-- player (TIM-35). Simpler and more reliable than trying to distinguish
-- a real disconnect from a flaky connection.

alter table players add column if not exists status text not null default 'active';
