import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

// Day 14 check-in. Two weeks in — usually the decision-making peak.
// We ask if anything's progressed and remind them they can mark
// "kupio sam" or "ne idem dalje" on the tracker.

export type CustomerFeedback14dProps = {
  customerName: string;
  displayId: string;
  trackerUrl: string;
  vehicleLabel: string;
};

export default function CustomerFeedback14d(props: CustomerFeedback14dProps) {
  return (
    <EmailLayout preview={`Kakva je situacija s upitom ${props.displayId}?`}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Dvije sedmice kasnije…</Heading>
        <Text className="text-base text-gray-700">Bok, {props.customerName},</Text>
        <Text className="text-base text-gray-700">
          Prošlo je 14 dana od tvog upita
          {props.vehicleLabel ? ` za ${props.vehicleLabel}` : ""}. Kako ide razgovor s dilerima?
          Jesi li uspio/la pregovarati cijenu, ili razmišljaš o drugom modelu?
        </Text>
        <Text className="text-base text-gray-700">
          Ako si već kupio/la vozilo, javi nam — ne treba ti više slati podsjetnike. Ako si
          odlučio/la ne ići dalje, isto označi — pomažeš nam pratiti kako platforma funkcionira.
        </Text>
      </Section>

      <Section className="mt-6">
        <Button
          href={props.trackerUrl}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Označi status na linku
        </Button>
        <Text className="mt-2 break-all text-xs text-gray-500">{props.trackerUrl}</Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          Ovo je automatska poruka. Ako se nisi javio/la, dobit ćeš još jedan finalni email za 30
          dana.
        </Text>
      </Section>
    </EmailLayout>
  );
}
