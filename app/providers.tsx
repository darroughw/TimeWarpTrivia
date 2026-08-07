"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { isPostHogConfigured, POSTHOG_HOST, POSTHOG_KEY } from "@/lib/posthog";

if (typeof window !== "undefined" && isPostHogConfigured) {
  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // captured manually below — App Router navigations aren't full page loads
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
}

// Next.js App Router doesn't fire a fresh page load on client-side
// navigation, so posthog-js's automatic pageview capture never sees a
// route change — this fires one manually whenever the path/query changes.
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (!pathname || !posthogClient) return;
    const url = searchParams?.size ? `${pathname}?${searchParams.toString()}` : pathname;
    posthogClient.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, posthogClient]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (!isPostHogConfigured) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
