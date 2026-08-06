"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { PlayerRow, RoomRow } from "@/lib/database.types";

interface RoomRealtimeState {
  room: RoomRow | null;
  players: PlayerRow[];
}

// Keeps a room row and its players list in sync over Supabase Realtime.
// Used by both the TV and phone live flows — it's the one thing they
// both need a reactive view of.
export function useRoomRealtime(roomId: string | null): RoomRealtimeState {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setPlayers([]);
      return;
    }

    let cancelled = false;

    async function loadInitial() {
      const [roomResult, playersResult] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", roomId as string).single(),
        supabase
          .from("players")
          .select("*")
          .eq("room_id", roomId as string)
          .order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      if (roomResult.data) setRoom(roomResult.data as RoomRow);
      if (playersResult.data) setPlayers(playersResult.data as PlayerRow[]);
    }
    loadInitial();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => setRoom(payload.new as RoomRow),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const inserted = payload.new as PlayerRow;
          setPlayers((current) => (current.some((p) => p.id === inserted.id) ? current : [...current, inserted]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as PlayerRow;
          setPlayers((current) => current.map((p) => (p.id === updated.id ? updated : p)));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { room, players };
}
