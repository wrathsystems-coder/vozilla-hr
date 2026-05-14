import { Button, Heading, Hr, Row, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export type LeadToDealerProps = {
  dealerName: string;
  displayId: string;
  brand?: string | null;
  model?: string | null;
  versionText?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  financingType?: string | null;
  hasTradeIn: boolean;
  timeFrame?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCounty?: string | null;
  customerPostcode: string;
  preferredContactMethod: string;
  bestContactTime?: string | null;
  /** N-1 from total dispatched: "ovaj lead poslan još N partnerima". */
  competitorCount: number;
  dashboardUrl: string;
  responseDeadlineHours: number;
};

const FINANCING_LABEL: Record<string, string> = {
  cash: "Gotovina",
  bank_loan: "Kredit banke",
  leasing: "Leasing",
  undecided: "Razmišlja",
};

const TIME_FRAME_LABEL: Record<string, string> = {
  immediate: "Odmah (do 7 dana)",
  "1m": "U sljedećih mjesec dana",
  "3m": "U sljedeća 3 mjeseca",
  "6m": "U sljedećih 6 mjeseci",
  later: "Više od 6 mjeseci / istražuje",
};

function formatPriceRange(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) => `${n.toLocaleString("hr-HR")} €`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `od ${fmt(min)}`;
  return `do ${fmt(max!)}`;
}

export default function LeadToDealer(props: LeadToDealerProps) {
  const vehicle = [props.brand, props.model].filter(Boolean).join(" ") || "novo vozilo";
  const priceRange = formatPriceRange(props.priceMin, props.priceMax);

  return (
    <EmailLayout preview={`Novi upit od kupca: ${vehicle} (${props.displayId})`}>
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Novi upit od kupca</Heading>
        <Text className="text-base text-gray-700">
          {props.dealerName}, kupac preko vozilla.hr traži <strong>{vehicle}</strong>. Lead ID:{" "}
          <strong>{props.displayId}</strong>.
        </Text>
      </Section>

      <Section className="mt-6">
        <Heading as="h2" className="text-lg font-semibold text-gray-900">
          Što kupac traži
        </Heading>
        {props.versionText ? (
          <Row>
            <Text className="text-sm text-gray-700">
              <strong>Verzija / specifikacija:</strong> {props.versionText}
            </Text>
          </Row>
        ) : null}
        {priceRange ? (
          <Row>
            <Text className="text-sm text-gray-700">
              <strong>Cjenovni raspon:</strong> {priceRange}
            </Text>
          </Row>
        ) : null}
        {props.financingType ? (
          <Row>
            <Text className="text-sm text-gray-700">
              <strong>Način kupnje:</strong>{" "}
              {FINANCING_LABEL[props.financingType] ?? props.financingType}
            </Text>
          </Row>
        ) : null}
        {props.hasTradeIn ? (
          <Row>
            <Text className="text-sm text-gray-700">
              <strong>Trade-in:</strong> ima vozilo za zamjenu (detalji u dashboardu)
            </Text>
          </Row>
        ) : null}
        {props.timeFrame ? (
          <Row>
            <Text className="text-sm text-gray-700">
              <strong>Vremenski okvir:</strong>{" "}
              {TIME_FRAME_LABEL[props.timeFrame] ?? props.timeFrame}
            </Text>
          </Row>
        ) : null}
      </Section>

      <Section className="mt-6">
        <Heading as="h2" className="text-lg font-semibold text-gray-900">
          Kontakt podaci
        </Heading>
        <Text className="text-sm text-gray-700">
          <strong>{props.customerName}</strong>
          <br />
          Telefon: <a href={`tel:${props.customerPhone}`}>{props.customerPhone}</a>
          <br />
          Email: <a href={`mailto:${props.customerEmail}`}>{props.customerEmail}</a>
          <br />
          Lokacija: {[props.customerCounty, props.customerPostcode].filter(Boolean).join(", ")}
          <br />
          Preferirani kontakt: {props.preferredContactMethod}
          {props.bestContactTime ? ` (${props.bestContactTime})` : ""}
        </Text>
      </Section>

      <Section className="mt-6 rounded bg-yellow-50 p-4">
        <Text className="text-sm font-semibold text-gray-900">
          {`Molimo kontaktirajte kupca u sljedećih ${props.responseDeadlineHours} sati.`}
        </Text>
        <Text className="text-xs text-gray-600">
          {`Ovaj lead poslan je još ${props.competitorCount} partnerima. Brzina i kvaliteta odgovora utječu na vaš rang u sustavu.`}
        </Text>
      </Section>

      <Section className="mt-6">
        <Button
          href={props.dashboardUrl}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Otvori u dashboardu
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
