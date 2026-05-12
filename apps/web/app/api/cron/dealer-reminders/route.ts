import { NextResponse } from "next/server";
import { assertCronAuth } from "@/lib/cron/auth";
import { runDealerRemindersTick } from "@/lib/cron/dealer-reminders";

export const dynamic = "force-dynamic";

// Vercel Cron: hits this hourly (see vercel.json). Idempotent — fires at
// most one reminder per (assignment, stage) per assignment lifetime.

export async function GET(request: Request) {
  const auth = assertCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const result = await runDealerRemindersTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
