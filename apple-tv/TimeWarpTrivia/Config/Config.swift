import Foundation

// The Supabase project connection — same production project the web app
// (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) already uses.
//
// Neither value is a secret: the anon key is *meant* to be embedded in
// client apps per Supabase's own security model — Row Level Security on
// the tables themselves is the actual access boundary, not keeping this
// key hidden.
//
// Originally routed through Info.plist via a Supabase.xcconfig build
// setting (INFOPLIST_KEY_SupabaseURL/SupabaseAnonKey), which turned out
// not to work: GENERATE_INFOPLIST_FILE's INFOPLIST_KEY_* mechanism only
// recognizes Apple's own curated list of known Info.plist keys (things
// like UILaunchScreen_Generation) — an arbitrary custom key name is
// silently dropped, not injected, so Bundle.main.object(forInfoDictionaryKey:)
// always returned nil and the fatalError below fired on every launch the
// instant anything touched SupabaseService.client. Plain Swift constants
// have no such curated-list problem.
enum Config {
    static let supabaseURL = URL(string: "https://haopvtzhpmfoylvrwdfv.supabase.co")!
    static let supabaseAnonKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3B2dHpocG1mb3lsdnJ3ZGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMTMxNzksImV4cCI6MjEwMTU4OTE3OX0.HHxpFwRc1iWK62jmWMVfEt_zj4vGs2CErWdLcZKLn0Q"
}
