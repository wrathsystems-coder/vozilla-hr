import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

// Sprint 7. Replaces the generic magic-link.tsx reuse from Sprint 5 so
// dealer password-reset emails read in the right voice ("Tvoj partnerski račun
// za vozilla.hr") and we can tune subject + copy independently of the
// other magic-link flows.

export type DealerPasswordResetProps = {
  dealerLegalName: string;
  resetUrl: string;
  /** TTL displayed to the dealer so they know when the link expires. */
  ttlHours: number;
};

export default function DealerPasswordReset(props: DealerPasswordResetProps) {
  return (
    <EmailLayout preview="Reset lozinke za partnerski račun na vozilla.hr">
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Resetiraj svoju lozinku</Heading>
        <Text className="text-base text-gray-700">Bok, {props.dealerLegalName},</Text>
        <Text className="text-base text-gray-700">
          Zatražio si reset lozinke za partnerski račun. Klikni na link ispod da postaviš novu
          lozinku. Ako nisi ti tražio, slobodno zanemari ovaj email — tvoja lozinka ostaje ista.
        </Text>
      </Section>

      <Section className="mt-6">
        <Button
          href={props.resetUrl}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Postavi novu lozinku
        </Button>
        <Text className="mt-2 break-all text-xs text-gray-500">{props.resetUrl}</Text>
      </Section>

      <Section className="mt-4">
        <Text className="text-xs text-gray-600">
          {`Link vrijedi ${props.ttlHours} sati. Nakon postavljanja nove lozinke, ostali postojeći reset linkovi prestaju vrijediti.`}
        </Text>
      </Section>

      <Hr className="my-6 border-gray-200" />

      <Section>
        <Text className="text-xs text-gray-500">
          [XXX_EMAIL_SIGNATURE_GENERIC: brand-voice potpis za sistemske emailove]
        </Text>
      </Section>
    </EmailLayout>
  );
}
