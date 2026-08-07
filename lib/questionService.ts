import { supabase } from "./supabaseClient";
import type { QuestionRow, RoomRow } from "./database.types";
import type { Decade, DecadeId, Question } from "./types";

export interface QuestionMeta {
  roundLabel: string;
  timeLimitSeconds: number;
  pointsMultiplier: number;
}

function questionRowToQuestion(row: QuestionRow, meta: QuestionMeta): Question {
  return {
    id: row.id,
    roundLabel: meta.roundLabel,
    decadeId: row.decade_id as DecadeId,
    text: row.text,
    options: row.options as [string, string, string, string],
    correctIndex: row.correct_index as 0 | 1 | 2 | 3,
    timeLimitSeconds: meta.timeLimitSeconds,
    pointsMultiplier: meta.pointsMultiplier,
  };
}

// Which stage-context (roundLabel / timeLimitSeconds / pointsMultiplier) a
// given question id represents for this room. Keyed off the room's own
// fields rather than room.status, so it stays correct regardless of
// exactly when a re-fetch happens relative to a status transition —
// question_ids and block_candidate_ids are both set once at Start Game
// and don't change again for the life of the room.
export function questionMetaForRoom(
  room: Pick<RoomRow, "question_ids" | "block_candidate_ids">,
  questionId: string,
): QuestionMeta {
  if (room.block_candidate_ids?.includes(questionId)) {
    return { roundLabel: "Solo Round", timeLimitSeconds: 15, pointsMultiplier: 1 };
  }
  const idx = room.question_ids?.indexOf(questionId) ?? -1;
  const round = idx === -1 ? 1 : Math.floor(idx / 5) + 1; // 1, 2, or 3
  const isFinal = round === 3;
  return {
    roundLabel: isFinal ? "Final Round" : `Round ${round}`,
    timeLimitSeconds: isFinal ? 15 : 20,
    pointsMultiplier: isFinal ? 2 : 1,
  };
}

export async function fetchQuestionById(id: string, meta: QuestionMeta): Promise<Question | null> {
  const { data, error } = await supabase.from("questions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? questionRowToQuestion(data as QuestionRow, meta) : null;
}

// Preserves the caller's id order (e.g. block_candidate_ids order) rather
// than whatever order Postgres happens to return rows in.
export async function fetchQuestionsByIds(ids: string[], meta: QuestionMeta): Promise<Question[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("questions").select("*").in("id", ids);
  if (error) throw error;
  const byId = new Map(((data as QuestionRow[]) ?? []).map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is QuestionRow => Boolean(row))
    .map((row) => questionRowToQuestion(row, meta));
}

// Picks `count` distinct random active questions, optionally scoped to one
// decade. Fetches the whole matching pool and shuffles client-side — at
// ~700 total rows this is a single fast round trip; if the catalog grows
// an order of magnitude this should move to a server-side
// `ORDER BY random()` via a Postgres RPC function (PostgREST can't order
// by an expression directly).
export async function fetchRandomQuestionSet(decadeFilter: DecadeId, count: number): Promise<QuestionRow[]> {
  let query = supabase.from("questions").select("*").eq("is_active", true);
  if (decadeFilter !== "all") {
    query = query.eq("decade_id", decadeFilter);
  }
  const { data, error } = await query;
  if (error) throw error;
  const rows = ((data as QuestionRow[]) ?? []).slice();
  if (rows.length < count) {
    throw new Error(`Not enough active questions for decade "${decadeFilter}" (have ${rows.length}, need ${count}).`);
  }
  for (let i = rows.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows.slice(0, count);
}

export async function fetchDecades(): Promise<Decade[]> {
  const { data, error } = await supabase
    .from("decades")
    .select("id, label")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return ((data as { id: string; label: string }[]) ?? []).map((d) => ({ id: d.id as DecadeId, label: d.label }));
}
