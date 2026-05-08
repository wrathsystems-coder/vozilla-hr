import { Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export type GdprRequestType = "access" | "erasure" | "rectification" | "portability" | "objection";

export type GdprRequestReceivedProps = {
  customerName: string;
  displayId: string;
  requestType: GdprRequestType;
  /** Days until we must resolve — GDPR mandates 30 (configurable for tightening). */
  resolutionDays: number;
};

const REQUEST_TYPE_LABEL: Record<GdprRequestType, string> = {
  access: "pristupa osobnim podacima",
  erasure: "brisanja osobnih podataka",
  rectification: "ispravka osobnih podataka",
  portability: "prenosivosti osobnih podataka",
  objection: "prigovora na obradu osobnih podataka",
};

export default function GdprRequestReceived(props: GdprRequestReceivedProps) {
  const typeLabel = REQUEST_TYPE_LABEL[props.requestType];

  return (
    <EmailLayout preview={`Zaprimili smo tvoj GDPR zahtjev (${props.displayId})`}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Zahtjev je zaprimljen</Heading>
        <Text className="text-base text-gray-700">Bok, {props.customerName},</Text>
        <Text className="text-base text-gray-700">
          Zaprimili smo tvoj zahtjev za <strong>{typeLabel}</strong> pod brojem{" "}
          <strong>{props.displayId}</strong>. Riješit ćemo ga u roku od{" "}
          {`${props.resolutionDays} dana`}, kako nalaže GDPR.
        </Text>
        <Text className="text-base text-gray-700">
          Ako trebamo dodatne informacije za obradu, javit ćemo se na ovaj email.
        </Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          [XXX_EMAIL_SIGNATURE_GDPR: brand-voice potpis, npr. "Voditelj obrade — vozilla.hr"]
        </Text>
      </Section>
    </EmailLayout>
  );
}
