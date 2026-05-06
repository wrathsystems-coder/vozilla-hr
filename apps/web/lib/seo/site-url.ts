export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const raw = fromEnv && fromEnv.length > 0 ? fromEnv : "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
