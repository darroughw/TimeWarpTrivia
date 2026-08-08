import { supabase } from "./supabaseClient";

// Write-only (TIM-28) — see supabase/migrations/0005_feedback.sql. Trims
// the optional fields down to null rather than empty strings, so a
// half-filled-in optional field doesn't sit in the table as "".
export async function submitFeedback(args: {
  message: string;
  categorySuggestion?: string;
  email?: string;
}): Promise<void> {
  const { message, categorySuggestion, email } = args;
  const { error } = await supabase.from("feedback").insert({
    message: message.trim(),
    category_suggestion: categorySuggestion?.trim() || null,
    email: email?.trim() || null,
  });
  if (error) throw error;
}
