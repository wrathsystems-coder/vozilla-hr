import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";
import type { GdprRequestType } from "./gdpr-request-received";

// Sprint 7. Admin sibling to gdpr-request-received: customer is notified
// their request landed; admin gets a parallel ping with the audit link
// so they don't miss the regulatory clock starting (resolution_days from
// EmailSettings → GdprRequests doc → audit log).

export type AdminNewGdprNotificationProps = {
  displayId: string;
  requestType: GdprRequestType;
  customerEmailMasked: string;
  /** Linked lead request id if the GDPR request references one. */
  linkedLeadId?: number | null;
  /** Days the platform has to resolve per GDPR (30 by default). */
  resolutionDays: number;
  adminUrl: string;
};

const REQUEST_TYPE_LABEL: Record<GdprRequestType, string> = {
  access: "Pristup podacima",
  erasure: "Brisanje podataka",
  rectification: "Ispravak podataka",
  portability: "Prenosivost podataka",
  objection: "Prigovor na obradu",
};

export default function AdminNewGdprNotification(props: AdminNewGdprNotificationProps) {
  const typeLabel = REQUEST_TYPE_LABEL[props.requestType];

  return (
    <EmailLayout preview={`Novi GDPR zahtjev ${props.displayId} (${typeLabel})`}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Novi GDPR zahtjev</Heading>
        <Text className="text-base text-gray-700">
          <strong>{props.displayId}</strong> — {typeLabel}
        </Text>
        <Text className="text-sm text-gray-700">
          Kupac: <code>{props.customerEmailMasked}</code>
          {props.linkedLeadId
            ? ` · Povezani upit: VZ-${props.linkedLeadId}`
            : " · Nema povezanog upita"}
        </Text>
        <Text className="text-sm text-yellow-800">
          {`Rok za rješavanje: ${props.resolutionDays} dana. Audit log će zapisati svaki state change.`}
        </Text>
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
