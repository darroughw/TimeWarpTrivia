import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Capture 100% of transactions in dev, 10% in production — this app has
  // almost no server-side code (everything's a client component talking
  // to Supabase directly), so volume is naturally low regardless.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});
