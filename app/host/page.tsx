"use client";

import LiveTvFlow from "../_game/LiveTvFlow";
import MockTvFlow from "../_game/MockTvFlow";
import LoadingState from "@/components/shared/LoadingState";
import SmallScreenNotice from "@/components/shared/SmallScreenNotice";
import { useIsLargeScreen } from "@/hooks/useIsLargeScreen";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export default function Host() {
  const isLargeScreen = useIsLargeScreen();

  // Don't know yet (server render / before the first effect runs) — wait
  // rather than flash the real game on a phone or the notice on a TV.
  if (isLargeScreen === null) return <LoadingState message="Loading…" />;
  if (!isLargeScreen) return <SmallScreenNotice />;

  return isSupabaseConfigured ? <LiveTvFlow /> : <MockTvFlow />;
}
