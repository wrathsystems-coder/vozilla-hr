export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const raw = fromEnv && fromEnv.length > 0 ? fromEnv : "http://localhost:3000";

  if (!/^https?:\/\//i.test(raw)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL mora počinjati s http:// ili https:// (dobiveno: "${raw}")`,
    );
  }

  return raw.replace(/\/+$/, "");
}
