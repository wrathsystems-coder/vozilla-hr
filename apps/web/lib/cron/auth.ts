// Cron auth helper. Vercel Cron supports two patterns:
//   1) Authorization: Bearer <CRON_SECRET>   (recommended for prod)
//   2) ?secret=<CRON_SECRET>                 (fallback for local curl)
// Either passes — both must match the env var.

export type CronAuthResult = { ok: true } | { ok: false; status: 401 | 503; message: string };

export function assertCronAuth(request: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.startsWith("XXX_")) {
    // Missing secret = misconfigured; return 503 so calls fail loud
    // instead of silently passing in dev/preview environments.
    return { ok: false, status: 503, message: "cron_secret_not_configured" };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return { ok: true };

  const url = new URL(request.url);
  const queryParam = url.searchParams.get("secret");
  if (queryParam && queryParam === secret) return { ok: true };

  return { ok: false, status: 401, message: "unauthorized" };
}
