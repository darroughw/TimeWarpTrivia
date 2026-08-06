"use client";

import LiveTvFlow from "./_game/LiveTvFlow";
import MockTvFlow from "./_game/MockTvFlow";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export default function Home() {
  return isSupabaseConfigured ? <LiveTvFlow /> : <MockTvFlow />;
}
