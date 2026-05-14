// Sentry browser SDK. Initialised at app boot when SENTRY_DSN is set;
// when the env is empty or still the XXX_ placeholder, init() is skipped
// and the SDK is a no-op (zero network calls, zero overhead).
//
// MVP default has Sentry off — flip on by populating SENTRY_DSN in
// .env.local / Vercel project settings.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? "";

if (dsn && !dsn.startsWith("XXX_")) {
  Sentry.init({
    dsn,
    // Conservative sample rate — public traffic doesn't warrant 100% in
    // production. Tracing is off until we have a budget for the volume.
    tracesSampleRate: 0,
    // Capture 0 replays by default — privacy + bandwidth. Bump to 0.1
    // if Replay becomes a Phase 2 ask.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
  });
}
