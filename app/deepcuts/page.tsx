"use client";

import LiveTvFlow from "../_game/LiveTvFlow";
import MockTvFlow from "../_game/MockTvFlow";
import LoadingState from "@/components/shared/LoadingState";
import SmallScreenNotice from "@/components/shared/SmallScreenNotice";
import { useIsLargeScreen } from "@/hooks/useIsLargeScreen";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

// Deep Cuts (TIM-41) — structural copy of /host, rendering the same
// LiveTvFlow game engine in "deepCuts" mode instead of a separate
// component. The Supabase-not-configured fallback reuses the generic
// app-wide MockTvFlow demo (decade-flavored) rather than a dedicated
// Deep Cuts mock — building a parallel demo experience is out of scope,
// and this path isn't hit in any environment with Supabase configured.
export default function DeepCuts() {
  const isLargeScreen = useIsLargeScreen();

  if (isLargeScreen === null) return <LoadingState message="Loading…" />;
  if (!isLargeScreen) return <SmallScreenNotice />;

  return isSupabaseConfigured ? <LiveTvFlow mode="deepCuts" /> : <MockTvFlow />;
}
