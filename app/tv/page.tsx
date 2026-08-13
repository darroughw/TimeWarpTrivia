"use client";

import TvIntroScreen from "@/components/tv/TvIntroScreen";
import LoadingState from "@/components/shared/LoadingState";
import SmallScreenNotice from "@/components/shared/SmallScreenNotice";
import { useIsLargeScreen } from "@/hooks/useIsLargeScreen";

// Entry point for the Android TV wrapper (TIM-10) — the WebView loads
// this instead of /host directly, so the app has an actual introduction
// instead of dropping straight into a freshly created, playerless room.
export default function Tv() {
  const isLargeScreen = useIsLargeScreen();

  if (isLargeScreen === null) return <LoadingState message="Loading…" />;
  if (!isLargeScreen) return <SmallScreenNotice />;

  return <TvIntroScreen />;
}
