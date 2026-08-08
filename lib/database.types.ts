import type { DecadeId } from "./types";

// Mirrors the TV route's Stage union — a room's status is the single
// source of truth for which screen every connected client renders.
// Round 3 (the final, double-points round) reuses "question"/"transition"
// like rounds 1-2 — which round is live is derived from question_index,
// not a separate status. See supabase/migrations/0003_round_structure.sql.
export type RoomStatus =
  | "lobby"
  | "countdown"
  | "question"
  | "transition"
  | "scoreboard"
  | "block"
  | "soloQuestion"
  | "soloTransition"
  | "end";

// Row shapes for supabase/migrations/0001_init.sql and
// supabase/migrations/0003_round_structure.sql.

export interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  status: RoomStatus;
  current_question_id: string | null;
  blocker_player_id: string | null;
  decade_filter: DecadeId;
  block_candidate_ids: string[] | null;
  // 15 ids in play order: round 1 = [0,5), round 2 = [5,10), round 3
  // (final, double points) = [10,15).
  question_ids: string[] | null;
  question_index: number | null;
  created_at: string;
}

// "left" is only ever set by an explicit host action (TIM-35) — there's
// no automatic disconnect detection. See
// supabase/migrations/0004_player_status.sql.
export type PlayerStatus = "active" | "left";

export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  avatar: string;
  score: number;
  status: PlayerStatus;
  created_at: string;
}

export interface AnswerRow {
  id: string;
  room_id: string;
  player_id: string;
  question_id: string;
  answer: number;
  response_time_ms: number;
  created_at: string;
}

// Row shapes for supabase/migrations/0002_question_content.sql.

export interface DecadeRow {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface CategoryRow {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  min_decade_id: string | null;
}

export interface QuestionRow {
  id: string;
  decade_id: string;
  category_id: string;
  text: string;
  options: string[]; // always length 4, enforced by a DB check constraint
  correct_index: number; // 0-3, enforced by a DB check constraint
  flavor_wrong: string | null;
  is_active: boolean;
  created_at: string;
}
