// Vercel sets x-forwarded-for; some proxies prefer x-real-ip. Fallback "unknown"
// keeps rate-limit keys consistent for unattributable requests instead of
// crashing or globally collapsing them onto a shared bucket.

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a list (client, proxy1, proxy2…). The client is the leftmost.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
