import { Resend } from "resend";
import type { ReactElement } from "react";
import { render } from "@react-email/render";

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
  from?: string;
};

export async function sendEmail({ to, subject, template, from }: SendArgs) {
  const html = await render(template);
  const text = await render(template, { plainText: true });
  const fromAddress = from ?? process.env.RESEND_FROM_EMAIL ?? "noreply@vozilla.hr";

  // Dev fallback: bez API ključa logiraj u konzolu i ne fail-aj.
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[email:dev] RESEND_API_KEY nije postavljen — email "${subject}" NIJE poslan na ${
        Array.isArray(to) ? to.join(", ") : to
      }`,
    );
    return { id: "dev-mock", from: fromAddress, to, subject };
  }

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
  return result.data;
}
