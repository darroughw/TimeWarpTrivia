import * as Sentry from "@sentry/nextjs";

// Most of this app's real logic runs client-side (LiveTvFlow/LivePlayFlow,
// every Supabase call, the round-progression state machine) — this is
// where a real bug would actually surface, not on the server.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Capture 100% of transactions in dev, 10% in production.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});

// Instruments App Router navigations as part of performance tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
