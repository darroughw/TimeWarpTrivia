import type { MetadataRoute } from "next";

// Only / and /privacy are indexable content pages — see robots.ts for
// why /host, /play, /deepcuts, and /tv are deliberately excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.timewarptrivia.com";
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
