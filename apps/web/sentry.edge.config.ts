// Sentry SDK for the Edge runtime (middleware, route handlers with
// `export const runtime = "edge"`). DSN-gated like the other two.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? "";

if (dsn && !dsn.startsWith("XXX_")) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
  });
}
