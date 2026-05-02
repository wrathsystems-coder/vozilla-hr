import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="hr">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-[560px] bg-white px-6 py-8">
            {children}
            <Section className="mt-8 border-t border-gray-200 pt-4">
              <Text className="text-center text-xs text-gray-500">
                vozilla.hr — [XXX_COMPANY_LEGAL_NAME], [XXX_COMPANY_ADDRESS]
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
