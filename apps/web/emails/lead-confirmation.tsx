import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export type LeadConfirmationProps = {
  customerName: string;
  displayId: string;
  trackerUrl: string;
  preferredContactMethod: "phone" | "email" | "whatsapp" | "any";
};

const CONTACT_METHOD_LABEL: Record<LeadConfirmationProps["preferredContactMethod"], string> = {
  phone: "telefonom",
  email: "emailom",
  whatsapp: "WhatsAppom",
  any: "telefonom ili emailom",
};

export default function LeadConfirmation(props: LeadConfirmationProps) {
  const contact = CONTACT_METHOD_LABEL[props.preferredContactMethod];

  return (
    <EmailLayout preview={`Tvoj upit ${props.displayId} je zaprimljen`}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Hvala, {props.customerName}!</Heading>
        <Text className="text-base text-gray-700">
          Zaprimili smo tvoj upit pod brojem <strong>{props.displayId}</strong>. Naš tim će ga
          pregledati i proslijediti odabranim dilerima u sljedećih{" "}
          <strong>[XXX_LEAD_PROCESSING_HOURS_RANGE]</strong> sati.
        </Text>
        <Text className="text-base text-gray-700">
          Dileri će te direktno kontaktirati {contact}. Provjeri i spam folder ako u idućem danu ne
          primiš poruku.
        </Text>
      </Section>

      <Section className="mt-6">
        <Heading as="h2" className="text-lg font-semibold text-gray-900">
          Prati status upita
        </Heading>
        <Text className="text-sm text-gray-700">
          Tvoj osobni link spremili smo u ovaj email. Otvori ga bilo kada da vidiš koji su te dileri
          kontaktirali, označiš zainteresiranost ili otkažeš upit.
        </Text>
        <Button
          href={props.trackerUrl}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Otvori tracker
        </Button>
        <Text className="mt-2 break-all text-xs text-gray-500">{props.trackerUrl}</Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          [XXX_EMAIL_SIGNATURE_LEAD: brand-voice potpis, 1-2 rečenice]
        </Text>
      </Section>
    </EmailLayout>
  );
}
