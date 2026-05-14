import { NextResponse } from "next/server";
import { assertCronAuth } from "@/lib/cron/auth";
import { runCustomerFeedbackTick } from "@/lib/cron/customer-feedback";

export const dynamic = "force-dynamic";

// Daily cron. Each lead receives at most one email per day-3/14/30
// milestone (idempotency via customer_feedback_emails_dayN_sent_at).

export async function GET(request: Request) {
  const auth = assertCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const result = await runCustomerFeedbackTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown_error" },
      { status: 500 },
    );
  }
}
