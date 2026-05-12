import { NextResponse } from "next/server";
import { assertCronAuth } from "@/lib/cron/auth";
import { runGdprHardDelete } from "@/lib/cron/gdpr-hard-delete";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = assertCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    const result = await runGdprHardDelete();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown_error" },
      { status: 500 },
    );
  }
}
