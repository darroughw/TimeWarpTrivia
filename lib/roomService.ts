import { supabase } from "./supabaseClient";
import type { AnswerRow, PlayerRow, RoomRow, RoomStatus } from "./database.types";
import type { DecadeId } from "./types";

const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no O/I — easy to misread on a TV
const MAX_CODE_ATTEMPTS = 5;

function generateRoomCode(): string {
  let letters = "";
  for (let i = 0; i < 4; i += 1) {
    letters += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
  }
  const digits = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `${letters}-${digits}`;
}

export async function createRoom(hostId: string): Promise<RoomRow> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ code, host_id: hostId, status: "lobby" satisfies RoomStatus, decade_filter: "all" })
      .select()
      .single();

    if (!error) return data as RoomRow;
    if (error.code !== "23505") throw error; // anything but "code already taken" is fatal
  }
  throw new Error("Couldn't generate a unique room code — try again.");
}

export async function fetchRoomByCode(code: string): Promise<RoomRow | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data as RoomRow | null;
}

export async function joinRoom(roomId: string, name: string, avatar: string): Promise<PlayerRow> {
  const { data, error } = await supabase
    .from("players")
    .insert({ room_id: roomId, name, avatar, score: 0 })
    .select()
    .single();
  if (error) throw error;
  return data as PlayerRow;
}

// Host-initiated removal (TIM-35) — the only way a player's status ever
// changes. Doesn't delete the row: their score and answers stay intact,
// they're just excluded from block-picker selection and active counts
// from here on (see lib/mockData.pickBlockChooser).
export async function removePlayer(playerId: string): Promise<void> {
  const { error } = await supabase.from("players").update({ status: "left" }).eq("id", playerId);
  if (error) throw error;
}

export async function fetchRoomPlayers(roomId: string): Promise<PlayerRow[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as PlayerRow[]) ?? [];
}

export async function updateRoom(
  roomId: string,
  patch: Partial<
    Pick<
      RoomRow,
      | "status"
      | "current_question_id"
      | "blocker_player_id"
      | "decade_filter"
      | "block_candidate_ids"
      | "question_ids"
      | "question_index"
      | "asked_question_ids"
    >
  >,
): Promise<void> {
  const { error } = await supabase.from("rooms").update(patch).eq("id", roomId);
  if (error) throw error;
}

// Play Again (TIM-38) resets only still-active players — anyone removed
// or left doesn't carry a score into the rematch since they're not
// carrying into the rematch at all (see LiveTvFlow.handlePlayAgain).
export async function resetActivePlayerScores(roomId: string): Promise<void> {
  const { error } = await supabase.from("players").update({ score: 0 }).eq("room_id", roomId).eq("status", "active");
  if (error) throw error;
}

// Play Again (TIM-38) clears answer history for the room. Scores already
// live on players.score rather than being derived from answers, so old
// rows serve no purpose after a rematch — and leaving them risks a
// unique(player_id, question_id) collision if a question repeats via
// fetchRandomQuestionSet's pool-exhaustion fallback.
export async function clearRoomAnswers(roomId: string): Promise<void> {
  const { error } = await supabase.from("answers").delete().eq("room_id", roomId);
  if (error) throw error;
}

export async function setDecadeFilter(roomId: string, decadeFilter: DecadeId): Promise<void> {
  await updateRoom(roomId, { decade_filter: decadeFilter });
}

export async function fetchAnswersForQuestion(roomId: string, questionId: string): Promise<AnswerRow[]> {
  const { data, error } = await supabase
    .from("answers")
    .select("*")
    .eq("room_id", roomId)
    .eq("question_id", questionId);
  if (error) throw error;
  return (data as AnswerRow[]) ?? [];
}

// Inserts the answer row, then — if it scored — applies the points to the
// player's own row. Both writes come from the answering player's own
// client; nothing here is server-validated (see README limitations).
export async function submitAnswer(args: {
  roomId: string;
  playerId: string;
  questionId: string;
  answerIndex: number;
  responseTimeMs: number;
  pointsGained: number;
}): Promise<void> {
  const { roomId, playerId, questionId, answerIndex, responseTimeMs, pointsGained } = args;

  const { error: answerError } = await supabase.from("answers").insert({
    room_id: roomId,
    player_id: playerId,
    question_id: questionId,
    answer: answerIndex,
    response_time_ms: responseTimeMs,
  });
  if (answerError) throw answerError;

  if (pointsGained > 0) {
    const { data: player, error: fetchError } = await supabase
      .from("players")
      .select("score")
      .eq("id", playerId)
      .single();
    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from("players")
      .update({ score: (player?.score ?? 0) + pointsGained })
      .eq("id", playerId);
    if (updateError) throw updateError;
  }
}
