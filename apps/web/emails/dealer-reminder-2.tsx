import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

// Second (48h) reminder. Tone: firmer — also pings admin in parallel.
// If the dealer hits 72h with no action, the cron flips
// reminders.expired_no_response on the assignment and degrades the
// dealer's avg_response_time_hours score.

export type DealerReminder2Props = {
  dealerName: string;
  displayId: string;
  vehicle: string;
  customerName: string;
  competitorCount: number;
  dashboardUrl: string;
  hoursSinceSent: number;
  expiresInHours: number;
};

export default function DealerReminder2(props: DealerReminder2Props) {
  return (
    <EmailLayout
      preview={`Drugi podsjetnik: ${props.displayId} ističe za ${Math.round(props.expiresInHours)}h`}
    >
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Drugi podsjetnik</Heading>
        <Text className="text-base text-gray-700">
          {props.dealerName}, prošlo je {Math.round(props.hoursSinceSent)} sati od kad smo ti
          poslali lead <strong>{props.displayId}</strong> ({props.vehicle}) za kupca{" "}
          <strong>{props.customerName}</strong>, a još nije označen kao kontaktiran.
        </Text>
      </Section>

      <Section className="mt-6 rounded bg-red-50 p-4">
        <Text className="text-sm font-semibold text-gray-900">
          Lead automatski ističe za {Math.round(props.expiresInHours)} sati. Nakon toga gubi se s
          tvoje liste i utječe na tvoj rang u idućim distribucijama.
        </Text>
      </Section>

      <Section className="mt-6">
        <Text className="text-sm text-gray-700">
          {props.competitorCount > 0
            ? `Lead poslan još ${props.competitorCount} partnerima. Drugi su možda već reagirali.`
            : "Kupac još uvijek čeka tvoj odgovor."}
        </Text>
      </Section>

      <Section className="mt-6">
        <Button
          href={props.dashboardUrl}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Otvori lead
        </Button>
        <Text className="mt-2 break-all text-xs text-gray-500">{props.dashboardUrl}</Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          [XXX_EMAIL_SIGNATURE_DEALER: brand-voice potpis za dilere, 1-2 rečenice]
        </Text>
      </Section>
    </EmailLayout>
  );
}
