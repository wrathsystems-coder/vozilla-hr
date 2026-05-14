// Sentry Node SDK (Next.js server runtime). Same DSN-gate as the client
// config; capturing server-side exceptions is more valuable than client
// breadcrumbs, so when DSN is present the server side always inits.

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
