import LeadConfirmation, { type LeadConfirmationProps } from "@/emails/lead-confirmation";
import LeadToDealer, { type LeadToDealerProps } from "@/emails/lead-to-dealer";
import MagicLink, { type MagicLinkProps } from "@/emails/magic-link";
import GdprRequestReceived, { type GdprRequestReceivedProps } from "@/emails/gdpr-request-received";
import GdprRequestResolved, { type GdprRequestResolvedProps } from "@/emails/gdpr-request-resolved";
import AdminNewLeadNotification, {
  type AdminNewLeadProps,
} from "@/emails/admin-new-lead-notification";
import DealerReminder1, { type DealerReminder1Props } from "@/emails/dealer-reminder-1";
import DealerReminder2, { type DealerReminder2Props } from "@/emails/dealer-reminder-2";
import { sendEmail, type SendResult } from "@/lib/email/client";

// Single entry point for transactional email. Discriminated union on `key`
// so each call site is forced to provide the right props for its template.
//
// Subjects are hardcoded HR (UI-tier text per CLAUDE.md). Sprint 7 polish
// will read EmailSettings global to honour admin-side enabled/subject_override
// toggles; until then dispatch is straight-through.

type Recipients = string | string[];

export type DispatchArgs =
  | { key: "lead-confirmation"; to: Recipients; props: LeadConfirmationProps }
  | { key: "lead-to-dealer"; to: Recipients; props: LeadToDealerProps }
  | { key: "magic-link"; to: Recipients; props: MagicLinkProps }
  | { key: "gdpr-request-received"; to: Recipients; props: GdprRequestReceivedProps }
  | { key: "gdpr-request-resolved"; to: Recipients; props: GdprRequestResolvedProps }
  | { key: "admin-new-lead-notification"; to: Recipients; props: AdminNewLeadProps }
  | { key: "dealer-reminder-1"; to: Recipients; props: DealerReminder1Props }
  | { key: "dealer-reminder-2"; to: Recipients; props: DealerReminder2Props };

export async function dispatch(args: DispatchArgs): Promise<SendResult> {
  let template;
  let subject: string;

  switch (args.key) {
    case "lead-confirmation":
      template = LeadConfirmation(args.props);
      subject = `Zaprimili smo tvoj upit ${args.props.displayId}`;
      break;
    case "lead-to-dealer": {
      const vehicle =
        [args.props.brand, args.props.model].filter(Boolean).join(" ") || "novo vozilo";
      template = LeadToDealer(args.props);
      subject = `Novi upit od kupca — ${vehicle} — ${args.props.displayId}`;
      break;
    }
    case "magic-link":
      // Caller controls subject for magic-link — context varies wildly
      // (tracker resend / password reset / draft resume).
      template = MagicLink(args.props);
      subject = args.props.subject;
      break;
    case "gdpr-request-received":
      template = GdprRequestReceived(args.props);
      subject = `Zaprimili smo tvoj GDPR zahtjev (${args.props.displayId})`;
      break;
    case "gdpr-request-resolved":
      template = GdprRequestResolved(args.props);
      subject =
        args.props.resolution === "resolved"
          ? `Tvoj GDPR zahtjev (${args.props.displayId}) je riješen`
          : `Tvoj GDPR zahtjev (${args.props.displayId}) je odbijen`;
      break;
    case "admin-new-lead-notification":
      template = AdminNewLeadNotification(args.props);
      subject = `[admin] Novi upit ${args.props.displayId}${
        args.props.flagReview ? " (review)" : ""
      }`;
      break;
    case "dealer-reminder-1":
      template = DealerReminder1(args.props);
      subject = `Podsjetnik: kupac čeka odgovor — ${args.props.displayId}`;
      break;
    case "dealer-reminder-2":
      template = DealerReminder2(args.props);
      subject = `Drugi podsjetnik: ${args.props.displayId} ističe za ${Math.round(args.props.expiresInHours)}h`;
      break;
  }

  return sendEmail({
    to: args.to,
    subject,
    template,
    templateName: args.key,
    payload: args.props as unknown as Record<string, unknown>,
  });
}
