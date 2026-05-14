// Sentry registration hook. Next.js calls this once at server boot;
// we forward to the runtime-specific config so the Node + Edge SDKs
// initialise with the right options. Both configs are DSN-gated, so
// when SENTRY_DSN is empty (MVP default) this is a no-op.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Next.js 15 calls onRequestError on every uncaught error in route handlers;
// @sentry/nextjs 10 exposes its hook as captureRequestError.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
