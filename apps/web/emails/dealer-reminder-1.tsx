import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

// First (24h) reminder. Tone: nudge — most dealers have just been busy.
// Carwow-style transparency around the competitor count keeps it
// motivating rather than scolding.

export type DealerReminder1Props = {
  dealerName: string;
  displayId: string;
  vehicle: string;
  customerName: string;
  competitorCount: number;
  dashboardUrl: string;
  hoursSinceSent: number;
};

export default function DealerReminder1(props: DealerReminder1Props) {
  return (
    <EmailLayout
      preview={`Podsjetnik: kupac ${props.customerName} čeka odgovor (${props.displayId})`}
    >
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Podsjetnik — kupac čeka</Heading>
        <Text className="text-base text-gray-700">
          {props.dealerName}, prošlo je {Math.round(props.hoursSinceSent)} sati otkad smo ti poslali
          lead <strong>{props.displayId}</strong> ({props.vehicle}). Kupac{" "}
          <strong>{props.customerName}</strong> još uvijek nije označen kao kontaktiran u tvom
          dashboardu.
        </Text>
      </Section>

      <Section className="mt-6 rounded bg-yellow-50 p-4">
        <Text className="text-sm text-gray-900">
          {props.competitorCount > 0
            ? `Ovaj lead poslan je još ${props.competitorCount} partnerima — brzina odgovora utječe na tvoj rang.`
            : "Kupac čeka tvoj odgovor."}
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
