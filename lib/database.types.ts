import type { DecadeId } from "./types";

// Mirrors the TV route's Stage union — a room's status is the single
// source of truth for which screen every connected client renders.
export type RoomStatus =
  | "lobby"
  | "question"
  | "transition"
  | "scoreboard"
  | "block"
  | "soloQuestion"
  | "soloTransition"
  | "finalQuestion"
  | "finalTransition"
  | "end";

// Row shapes for supabase/migrations/0001_init.sql.

export interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  status: RoomStatus;
  current_round: number | null;
  current_question_id: string | null;
  blocker_player_id: string | null;
  decade_filter: DecadeId;
  block_candidate_ids: string[] | null;
  final_question_id: string | null;
  created_at: string;
}

export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  avatar: string;
  score: number;
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
