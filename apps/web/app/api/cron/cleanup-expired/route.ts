import { NextResponse } from "next/server";
import { assertCronAuth } from "@/lib/cron/auth";
import { runCleanupExpired } from "@/lib/cron/cleanup-expired";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = assertCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    const result = await runCleanupExpired();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown_error" },
      { status: 500 },
    );
  }
}
