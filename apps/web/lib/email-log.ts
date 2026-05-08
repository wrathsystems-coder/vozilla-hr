import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { emailLog } from "@/lib/db/schema";
import { now } from "@/lib/utils/time";

// Tracks every transactional email so we can debug delivery issues, replay
// failed sends, and answer "did the customer get the confirmation?". Spec:
// docs/spec/05-data-and-systems.md "email_log".

export type EmailQueuedArgs = {
  templateName: string;
  /** Single recipient or comma-joined list when sendEmail receives an array. */
  recipientEmail: string;
  subject: string;
  /** Structured props the template was rendered with. PII OK — same retention as the email itself. */
  payload?: Record<string, unknown>;
};

export async function logEmailQueued(args: EmailQueuedArgs): Promise<{ id: number }> {
  const [row] = await getDb()
    .insert(emailLog)
    .values({
      templateName: args.templateName,
      recipientEmail: args.recipientEmail,
      subject: args.subject,
      payload: (args.payload as never) ?? null,
      status: "pending",
    })
    .returning({ id: emailLog.id });
  return { id: row.id };
}

export async function markSent(id: number, providerMessageId: string | null): Promise<void> {
  await getDb()
    .update(emailLog)
    .set({
      status: "sent",
      providerMessageId,
      sentAt: now(),
    })
    .where(eq(emailLog.id, id));
}

export async function markFailed(id: number, errorMessage: string): Promise<void> {
  await getDb()
    .update(emailLog)
    .set({
      status: "failed",
      errorMessage,
    })
    .where(eq(emailLog.id, id));
}
