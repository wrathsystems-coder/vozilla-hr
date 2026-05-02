import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_layout";

export default function SmokeEmail() {
  return (
    <EmailLayout preview="vozilla.hr email pipeline test">
      <Section>
        <Heading className="text-2xl font-bold text-gray-900">Email pipeline radi</Heading>
        <Text className="text-base text-gray-700">
          Smoke test template (Sprint 0). Pravi templati dolaze u Sprintu 4.
        </Text>
      </Section>
    </EmailLayout>
  );
}
