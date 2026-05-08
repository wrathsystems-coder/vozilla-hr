import { Resend } from "resend";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { logEmailQueued, markFailed, markSent } from "@/lib/email-log";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY nije postavljen. Vidi .env.example.");
  }
  _resend = new Resend(apiKey);
  return _resend;
}

type SendArgs = {
  to: string | string[];
  subject: string;
  template: ReactElement;
  /** Identifier for email_log + EmailSettings template registry (e.g. "lead-confirmation"). */
  templateName: string;
  /** Structured props the template rendered with — stored on the email_log row for debugging. */
  payload?: Record<string, unknown>;
  from?: string;
};

export type SendResult = {
  id: string;
  logId: number;
};

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const { to, subject, template, templateName, payload, from } = args;
  const html = await render(template);
  const text = await render(template, { plainText: true });
  const fromAddress = from ?? process.env.RESEND_FROM_EMAIL ?? "noreply@vozilla.hr";
  const recipient = Array.isArray(to) ? to.join(", ") : to;

  const { id: logId } = await logEmailQueued({
    templateName,
    recipientEmail: recipient,
    subject,
    payload,
  });

  // Dev fallback: bez API ključa logiraj queued+sent (dev-mock id), warn,
  // i ne fail-aj — Sprint 4 lokalni razvoj bez Resend računa mora raditi.
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[email:dev] RESEND_API_KEY nije postavljen — email "${subject}" NIJE poslan na ${recipient}`,
    );
    await markSent(logId, "dev-mock");
    return { id: "dev-mock", logId };
  }

  try {
    const result = await getResend().emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    });
    if (result.error) {
      throw new Error(`Resend send failed: ${result.error.message}`);
    }
    await markSent(logId, result.data?.id ?? null);
    return { id: result.data?.id ?? "", logId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markFailed(logId, message);
    throw err;
  }
}
