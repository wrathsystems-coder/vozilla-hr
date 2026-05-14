import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

// Sprint 7. Double opt-in confirmation. Subscriber lands in
// newsletter_subscribers with status='pending_confirmation' + a UUID
// confirmation token; clicking the button transitions to status='active'.
// Without the click, the row sits in pending_confirmation indefinitely and
// is GDPR-safe (we never sent them anything but this one transactional
// email, and we did so based on their explicit signup).

export type NewsletterConfirmProps = {
  /** May be empty — we may not have a name from the signup form. */
  recipientName: string;
  confirmUrl: string;
  /** Hours until the confirmation token expires. */
  ttlHours: number;
};

export default function NewsletterConfirm(props: NewsletterConfirmProps) {
  const greeting = props.recipientName?.trim() ? `Bok, ${props.recipientName},` : "Bok,";

  return (
    <EmailLayout preview="Potvrdi pretplatu na newsletter vozilla.hr">
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Potvrdi pretplatu</Heading>
        <Text className="text-base text-gray-700">{greeting}</Text>
        <Text className="text-base text-gray-700">
          Zatražio/la si pretplatu na newsletter vozilla.hr. Klikni gumb ispod da potvrdiš svoju
          email adresu i počneš primati naše obavijesti.
        </Text>
      </Section>

      <Section className="mt-6">
        <Button
          href={props.confirmUrl}
          className="rounded bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Potvrdi pretplatu
        </Button>
        <Text className="mt-2 break-all text-xs text-gray-500">{props.confirmUrl}</Text>
      </Section>

      <Section className="mt-4">
        <Text className="text-xs text-gray-600">
          {`Link vrijedi ${props.ttlHours} sati. Ako nisi tražio/la pretplatu, slobodno zanemari ovaj email — nećeš biti dodan/a na listu.`}
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
