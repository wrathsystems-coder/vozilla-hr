import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

// Day 30 check-in. Final ask — what was the outcome? After this we
// stop chasing (cron picks no more days). Outcome data drives Phase 2
// dealer ranking + helps editorial pick "most-asked-about" models.

export type CustomerFeedback30dProps = {
  customerName: string;
  displayId: string;
  trackerUrl: string;
  vehicleLabel: string;
};

export default function CustomerFeedback30d(props: CustomerFeedback30dProps) {
  return (
    <EmailLayout preview={`Kako je završio upit ${props.displayId}?`}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Kako se završilo?</Heading>
        <Text className="text-base text-gray-700">Bok, {props.customerName},</Text>
        <Text className="text-base text-gray-700">
          Prošao je mjesec dana od tvog upita
          {props.vehicleLabel ? ` za ${props.vehicleLabel}` : ""}. Ovo je naš zadnji email — nakon
          danas ti više nećemo slati podsjetnike vezane uz ovaj upit.
        </Text>
        <Text className="text-base text-gray-700">
          Možeš li nam, kao zadnju uslugu, označiti što se dogodilo? Jesi li kupio/la, gdje, jesi li
          zadovoljan/na s partnerom — sve to ostaje povjerljivo i pomaže nam da kasnije bolje
          predlažemo dilere drugim kupcima.
        </Text>
      </Section>

      <Section className="mt-6">
        <Button
          href={props.trackerUrl}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Označi konačni status
        </Button>
        <Text className="mt-2 break-all text-xs text-gray-500">{props.trackerUrl}</Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          Hvala što si bio/la dio vozilla.hr. Ako te slučajno opet zatreba novi auto — link je
          uvijek tu.
        </Text>
      </Section>
    </EmailLayout>
  );
}
