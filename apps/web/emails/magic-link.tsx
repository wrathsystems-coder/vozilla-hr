import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

// Generic magic-link wrapper. Used for tracker resend (Sprint 4),
// password reset (Sprint 5), and any future single-purpose link flow.
// Caller controls subject + the human-readable reason text.

export type MagicLinkProps = {
  recipientName: string;
  /** Subject set by the caller via dispatch — passed here only for preview text. */
  subject: string;
  /** Heading shown in the email body (e.g. "Tvoj tracking link" / "Resetiraj lozinku"). */
  heading: string;
  /** 1-2 sentences explaining what clicking the link will do. */
  explanation: string;
  url: string;
  /** TTL displayed to the user so they know the deadline. */
  ttlHours: number;
};

export default function MagicLink(props: MagicLinkProps) {
  return (
    <EmailLayout preview={props.subject}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">{props.heading}</Heading>
        <Text className="text-base text-gray-700">Bok, {props.recipientName},</Text>
        <Text className="text-base text-gray-700">{props.explanation}</Text>
      </Section>

      <Section className="mt-6">
        <Button
          href={props.url}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Otvori link
        </Button>
        <Text className="mt-2 break-all text-xs text-gray-500">{props.url}</Text>
      </Section>

      <Section className="mt-4">
        <Text className="text-xs text-gray-600">
          {`Link vrijedi ${props.ttlHours} sati. Ako nisi tražio/la ovaj email, slobodno ga zanemari.`}
        </Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          [XXX_EMAIL_SIGNATURE_GENERIC: brand-voice potpis za sistemske emailove]
        </Text>
      </Section>
    </EmailLayout>
  );
}
