"use client";

import { useState } from "react";
import LiveTvFlow from "../_game/LiveTvFlow";
import MockTvFlow from "../_game/MockTvFlow";
import SimulatorTvFlow from "../_game/SimulatorTvFlow";
import LoadingState from "@/components/shared/LoadingState";
import SmallScreenNotice from "@/components/shared/SmallScreenNotice";
import { useIsLargeScreen } from "@/hooks/useIsLargeScreen";
import { useKonamiCode } from "@/hooks/useKonamiCode";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export default function Host() {
  const isLargeScreen = useIsLargeScreen();
  // Hidden portfolio-demo mode (see app/_game/SimulatorTvFlow) — requires
  // a real Supabase-backed room to be joinable from a phone, so the code
  // is a no-op without it, same as every other real-game feature.
  const [simulatorUnlocked, setSimulatorUnlocked] = useState(false);
  useKonamiCode(() => setSimulatorUnlocked(true));

  // Don't know yet (server render / before the first effect runs) — wait
  // rather than flash the real game on a phone or the notice on a TV.
  if (isLargeScreen === null) return <LoadingState message="Loading…" />;
  if (!isLargeScreen) return <SmallScreenNotice />;

  if (simulatorUnlocked && isSupabaseConfigured) return <SimulatorTvFlow />;
  return isSupabaseConfigured ? <LiveTvFlow /> : <MockTvFlow />;
}
