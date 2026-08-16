import type { MetadataRoute } from "next";

// /host, /play, and /deepcuts all create a real Supabase room as soon as
// they load client-side (see CLAUDE.md's Routes section) — a crawler
// indexing those URLs would spawn ghost rooms in production, not just
// waste a crawl budget. /tv is the Android TV wrapper's entry point, not
// a page anyone should land on from search. Only / and /privacy are
// actual content pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy"],
      disallow: ["/host", "/play", "/deepcuts", "/tv"],
    },
    sitemap: "https://www.timewarptrivia.com/sitemap.xml",
  };
}
