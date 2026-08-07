"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Replaces the entire root layout when something crashes badly enough to
// take down the app shell itself — Next.js requires this to render its
// own <html>/<body>, so it can't lean on the normal layout/providers.
// Kept intentionally minimal (inline styles, no SCSS modules, no other
// app code) since this is the last line of defense if something upstream
// of it is what broke.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          background: "#0b0e1a",
          color: "#fbf6ec",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Something broke.</h1>
        <p style={{ color: "#a7abc4", margin: 0, maxWidth: "28rem" }}>
          Not a trivia question — an actual bug. It&rsquo;s been reported. Try reloading.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "999px",
            border: "none",
            background: "#ffb238",
            color: "#171425",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
