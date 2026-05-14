import { withPayload } from "@payloadcms/next/withPayload";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

// Sentry source-map upload is gated on SENTRY_AUTH_TOKEN — when empty
// (MVP default) the wrapper is effectively a no-op pass-through. silent
// prevents noise in CI logs when nothing is configured.
const sentryEnabled =
  Boolean(process.env.SENTRY_AUTH_TOKEN) && !process.env.SENTRY_AUTH_TOKEN?.startsWith("XXX_");

const wrapped = withPayload(nextConfig);

export default sentryEnabled
  ? withSentryConfig(wrapped, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : wrapped;
