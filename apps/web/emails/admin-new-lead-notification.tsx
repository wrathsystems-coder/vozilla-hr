import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export type AdminNewLeadProps = {
  displayId: string;
  customerName: string;
  brand?: string | null;
  model?: string | null;
  /** 0..1 from Google or null when bypassed in dev. */
  recaptchaScore: number | null;
  source: string;
  adminUrl: string;
  /** True when reCAPTCHA score < review_below — flag for closer admin look. */
  flagReview: boolean;
};

export default function AdminNewLeadNotification(props: AdminNewLeadProps) {
  const vehicle = [props.brand, props.model].filter(Boolean).join(" ") || "(bez specifikacije)";
  const scoreLabel = props.recaptchaScore == null ? "—" : props.recaptchaScore.toFixed(2);

  return (
    <EmailLayout preview={`Novi upit ${props.displayId}${props.flagReview ? " (review)" : ""}`}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">
          Novi upit {props.flagReview ? "🚩 (review)" : ""}
        </Heading>
        <Text className="text-base text-gray-700">
          <strong>{props.displayId}</strong> — {props.customerName} traži {vehicle}.
        </Text>
        <Text className="text-sm text-gray-700">
          Source: <code>{props.source}</code> · reCAPTCHA: <code>{scoreLabel}</code>
        </Text>
        {props.flagReview ? (
          <Text className="text-sm text-yellow-800">
            reCAPTCHA score je ispod review threshold-a — provjeri ručno prije slanja partnerima.
          </Text>
        ) : null}
      </Section>

      <Section className="mt-6">
        <Button
          href={props.adminUrl}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Otvori u admin panelu
        </Button>
        <Text className="mt-2 break-all text-xs text-gray-500">{props.adminUrl}</Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          Auto-notifikacija. Postavke pretplate: admin → Email Settings.
        </Text>
      </Section>
    </EmailLayout>
  );
}
