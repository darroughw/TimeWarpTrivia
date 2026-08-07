// PostHog was provisioned through the Vercel Marketplace integration,
// which names its env vars per-project (the "twt_" segment) and mirrors
// them under several framework-specific prefixes (VITE_, NUXT_PUBLIC_,
// plain PUBLIC_) in case this project ever isn't Next.js. These are the
// two that actually matter here.
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_twt_POSTHOG_PROJECT_TOKEN;
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_twt_POSTHOG_HOST;

export const isPostHogConfigured = Boolean(POSTHOG_KEY && POSTHOG_HOST);
