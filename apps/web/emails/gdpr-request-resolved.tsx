import { Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";
import type { GdprRequestType } from "./gdpr-request-received";

export type GdprRequestResolvedProps = {
  customerName: string;
  displayId: string;
  requestType: GdprRequestType;
  /** "resolved" or "rejected" — admin marks during review. */
  resolution: "resolved" | "rejected";
  /** Free-text rationale shown to the customer. May contain XXX_ if admin didn't fill in. */
  adminNotes?: string | null;
};

const REQUEST_TYPE_LABEL: Record<GdprRequestType, string> = {
  access: "pristup",
  erasure: "brisanje",
  rectification: "ispravak",
  portability: "prenosivost",
  objection: "prigovor",
};

export default function GdprRequestResolved(props: GdprRequestResolvedProps) {
  const typeLabel = REQUEST_TYPE_LABEL[props.requestType];
  const headingText = props.resolution === "resolved" ? "Zahtjev je riješen" : "Zahtjev je odbijen";
  const bodyIntro =
    props.resolution === "resolved"
      ? `Tvoj zahtjev za ${typeLabel} (${props.displayId}) smo riješili.`
      : `Tvoj zahtjev za ${typeLabel} (${props.displayId}) je odbijen.`;

  return (
    <EmailLayout preview={`Tvoj GDPR zahtjev (${props.displayId}) — status promijenjen`}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">{headingText}</Heading>
        <Text className="text-base text-gray-700">Bok, {props.customerName},</Text>
        <Text className="text-base text-gray-700">{bodyIntro}</Text>
        {props.adminNotes ? (
          <Text className="rounded bg-gray-50 p-4 text-sm text-gray-700">{props.adminNotes}</Text>
        ) : null}
        <Text className="text-base text-gray-700">
          Ako imaš dodatnih pitanja, javi nam se na DPO email iz našeg impressuma.
        </Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          [XXX_EMAIL_SIGNATURE_GDPR: brand-voice potpis]
        </Text>
      </Section>
    </EmailLayout>
  );
}
