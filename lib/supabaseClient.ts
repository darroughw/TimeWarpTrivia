import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Both routes check this to decide whether to run the real
// Supabase-backed flow or fall back to the scripted mock flow — see
// app/page.tsx and app/play/page.tsx.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — " +
      "see .env.local.example. Falling back to a placeholder client and the mock game flow.",
  );
}

// Shared client for both the TV routes and the /play phone routes.
// Schema: supabase/migrations/0001_init.sql (rooms/players/answers).
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);
