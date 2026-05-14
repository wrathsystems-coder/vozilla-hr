import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

// Day 3 check-in. The customer's lead went out to dealers 3 days ago;
// we ask "did anyone get in touch?". Tracker URL takes them to
// /upit/[token]/ where they can mark each dealer as
// interested/not_interested or report they bought elsewhere.

export type CustomerFeedback3dProps = {
  customerName: string;
  displayId: string;
  /** Magic-link tracker URL (/upit/<token>). */
  trackerUrl: string;
  /** Vehicle string for context (e.g. "Audi A4") — empty when none specified. */
  vehicleLabel: string;
  /** Count of dealers the lead went to (for "još 3 dilera" copy). */
  dealerCount: number;
};

export default function CustomerFeedback3d(props: CustomerFeedback3dProps) {
  const dealerLine =
    props.dealerCount === 1
      ? "Diler ima sve potrebne podatke i trebao bi te kontaktirati u idućih nekoliko dana."
      : `${props.dealerCount} dilera ima sve potrebne podatke i trebali bi te kontaktirati u idućih nekoliko dana.`;

  return (
    <EmailLayout preview={`Kako ide s tvojim upitom ${props.displayId}?`}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Kako ide?</Heading>
        <Text className="text-base text-gray-700">Bok, {props.customerName},</Text>
        <Text className="text-base text-gray-700">
          Prošla su 3 dana od kad si poslao/la upit
          {props.vehicleLabel ? ` za ${props.vehicleLabel}` : ""}. {dealerLine}
        </Text>
        <Text className="text-base text-gray-700">
          Označi koji su te dileri kontaktirali — pomažeš nam da znamo tko ozbiljno radi.
        </Text>
      </Section>

      <Section className="mt-6">
        <Button
          href={props.trackerUrl}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Otvori praćenje upita
        </Button>
        <Text className="mt-2 break-all text-xs text-gray-500">{props.trackerUrl}</Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          Ovo je automatska poruka. Ne treba ti odgovarati — sve akcije su na linku iznad.
        </Text>
      </Section>
    </EmailLayout>
  );
}
