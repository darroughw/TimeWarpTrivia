import * as Sentry from "@sentry/nextjs";

// Most of this app's real logic runs client-side (LiveTvFlow/LivePlayFlow,
// every Supabase call, the round-progression state machine) — this is
// where a real bug would actually surface, not on the server.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Capture 100% of transactions in dev, 10% in production.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  ignoreErrors: [
    // Not this app's bug — nothing here touches window.webkit. iOS
    // in-app browsers (Instagram, Facebook, TikTok, ...) inject their
    // own native-bridge detection script that reads
    // window.webkit.messageHandlers.<handlerName> without checking
    // window.webkit exists first. It throws in the same page context as
    // whatever site the user opened inside that in-app browser,
    // regardless of that site's own code. Widely-reported false
    // positive: https://github.com/getsentry/sentry-javascript/issues/3040
    /webkit\.messageHandlers/,
  ],
});

// Instruments App Router navigations as part of performance tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
