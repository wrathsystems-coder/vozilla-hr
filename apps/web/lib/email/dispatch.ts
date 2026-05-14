import type { ReactElement } from "react";
import LeadConfirmation, { type LeadConfirmationProps } from "@/emails/lead-confirmation";
import LeadToDealer, { type LeadToDealerProps } from "@/emails/lead-to-dealer";
import MagicLink, { type MagicLinkProps } from "@/emails/magic-link";
import GdprRequestReceived, { type GdprRequestReceivedProps } from "@/emails/gdpr-request-received";
import GdprRequestResolved, { type GdprRequestResolvedProps } from "@/emails/gdpr-request-resolved";
import AdminNewLeadNotification, {
  type AdminNewLeadProps,
} from "@/emails/admin-new-lead-notification";
import AdminNewGdprNotification, {
  type AdminNewGdprNotificationProps,
} from "@/emails/admin-new-gdpr-notification";
import DealerReminder1, { type DealerReminder1Props } from "@/emails/dealer-reminder-1";
import DealerReminder2, { type DealerReminder2Props } from "@/emails/dealer-reminder-2";
import DealerPasswordReset, { type DealerPasswordResetProps } from "@/emails/dealer-password-reset";
import NewsletterConfirm, { type NewsletterConfirmProps } from "@/emails/newsletter-confirm";
import CustomerFeedback3d, { type CustomerFeedback3dProps } from "@/emails/customer-feedback-3d";
import CustomerFeedback14d, { type CustomerFeedback14dProps } from "@/emails/customer-feedback-14d";
import CustomerFeedback30d, { type CustomerFeedback30dProps } from "@/emails/customer-feedback-30d";
import { sendEmail, type SendResult } from "@/lib/email/client";
import { getEmailSettings, resolveTemplate, type EmailTemplateKey } from "@/lib/email/settings";

// Single entry point for transactional email. Discriminated union on `key`
// so each call site is forced to provide the right props for its template.
//
// Per-template runtime behaviour comes from the EmailSettings global:
//   - enabled=false → skip dispatch entirely (logged via console.info,
//     synthetic SendResult returned so callers don't need to special-case)
//   - subject_override → wins over the hardcoded HR subject below
//   - from_email → wins over RESEND_FROM_EMAIL env
//   - reply_to → passed to Resend as replyTo (replies hit info@ inbox)

type Recipients = string | string[];

export type DispatchArgs =
  | { key: "lead-confirmation"; to: Recipients; props: LeadConfirmationProps }
  | { key: "lead-to-dealer"; to: Recipients; props: LeadToDealerProps }
  | { key: "magic-link"; to: Recipients; props: MagicLinkProps }
  | { key: "gdpr-request-received"; to: Recipients; props: GdprRequestReceivedProps }
  | { key: "gdpr-request-resolved"; to: Recipients; props: GdprRequestResolvedProps }
  | { key: "admin-new-lead-notification"; to: Recipients; props: AdminNewLeadProps }
  | { key: "admin-new-gdpr-notification"; to: Recipients; props: AdminNewGdprNotificationProps }
  | { key: "dealer-reminder-1"; to: Recipients; props: DealerReminder1Props }
  | { key: "dealer-reminder-2"; to: Recipients; props: DealerReminder2Props }
  | { key: "dealer-password-reset"; to: Recipients; props: DealerPasswordResetProps }
  | { key: "newsletter-confirm"; to: Recipients; props: NewsletterConfirmProps }
  | { key: "customer-feedback-3d"; to: Recipients; props: CustomerFeedback3dProps }
  | { key: "customer-feedback-14d"; to: Recipients; props: CustomerFeedback14dProps }
  | { key: "customer-feedback-30d"; to: Recipients; props: CustomerFeedback30dProps };

type RenderResult = { template: ReactElement; subject: string };

/**
 * Pure renderer + default subject. Exported so unit tests can exercise
 * subject construction without hitting Payload or Resend.
 */
export function renderTemplate(args: DispatchArgs): RenderResult {
  switch (args.key) {
    case "lead-confirmation":
      return {
        template: LeadConfirmation(args.props),
        subject: `Zaprimili smo tvoj upit ${args.props.displayId}`,
      };
    case "lead-to-dealer": {
      const vehicle =
        [args.props.brand, args.props.model].filter(Boolean).join(" ") || "novo vozilo";
      return {
        template: LeadToDealer(args.props),
        subject: `Novi upit od kupca — ${vehicle} — ${args.props.displayId}`,
      };
    }
    case "magic-link":
      // Caller controls subject for magic-link — context varies wildly
      // (tracker resend / password reset / draft resume).
      return { template: MagicLink(args.props), subject: args.props.subject };
    case "gdpr-request-received":
      return {
        template: GdprRequestReceived(args.props),
        subject: `Zaprimili smo tvoj GDPR zahtjev (${args.props.displayId})`,
      };
    case "gdpr-request-resolved":
      return {
        template: GdprRequestResolved(args.props),
        subject:
          args.props.resolution === "resolved"
            ? `Tvoj GDPR zahtjev (${args.props.displayId}) je riješen`
            : `Tvoj GDPR zahtjev (${args.props.displayId}) je odbijen`,
      };
    case "admin-new-lead-notification":
      return {
        template: AdminNewLeadNotification(args.props),
        subject: `[admin] Novi upit ${args.props.displayId}${
          args.props.flagReview ? " (review)" : ""
        }`,
      };
    case "admin-new-gdpr-notification":
      return {
        template: AdminNewGdprNotification(args.props),
        subject: `[admin] Novi GDPR zahtjev ${args.props.displayId}`,
      };
    case "dealer-reminder-1":
      return {
        template: DealerReminder1(args.props),
        subject: `Podsjetnik: kupac čeka odgovor — ${args.props.displayId}`,
      };
    case "dealer-reminder-2":
      return {
        template: DealerReminder2(args.props),
        subject: `Drugi podsjetnik: ${args.props.displayId} ističe za ${Math.round(args.props.expiresInHours)}h`,
      };
    case "dealer-password-reset":
      return {
        template: DealerPasswordReset(args.props),
        subject: "Reset lozinke za vozilla.hr — dileri",
      };
    case "newsletter-confirm":
      return {
        template: NewsletterConfirm(args.props),
        subject: "Potvrdi pretplatu na newsletter vozilla.hr",
      };
    case "customer-feedback-3d":
      return {
        template: CustomerFeedback3d(args.props),
        subject: `Kako ide s upitom ${args.props.displayId}?`,
      };
    case "customer-feedback-14d":
      return {
        template: CustomerFeedback14d(args.props),
        subject: `Pregovori s dilerima — upit ${args.props.displayId}`,
      };
    case "customer-feedback-30d":
      return {
        template: CustomerFeedback30d(args.props),
        subject: `Posljednje pitanje o upitu ${args.props.displayId}`,
      };
  }
}

export async function dispatch(args: DispatchArgs): Promise<SendResult> {
  const settings = await getEmailSettings();
  // DispatchArgs.key is a strict subset of EmailTemplateKey; the cast
  // just narrows the union for the resolveTemplate lookup.
  const templateKey: EmailTemplateKey = args.key;
  const tpl = resolveTemplate(settings, templateKey);

  if (!tpl.enabled) {
    console.info(
      `[email] template "${args.key}" is disabled in EmailSettings — not sending to ${
        Array.isArray(args.to) ? args.to.join(", ") : args.to
      }`,
    );
    return { id: `skipped:${args.key}`, logId: 0 };
  }

  const { template, subject: defaultSubject } = renderTemplate(args);
  const subject = tpl.subjectOverride ?? defaultSubject;

  return sendEmail({
    to: args.to,
    subject,
    template,
    templateName: args.key,
    payload: args.props as unknown as Record<string, unknown>,
    from: settings.fromEmail ?? undefined,
    replyTo: settings.replyTo ?? undefined,
  });
}
