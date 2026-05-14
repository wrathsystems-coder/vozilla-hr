import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Politika privatnosti",
};

export default function PolitikaPrivatnostiPage() {
  return <LegalPageShell slug="politika-privatnosti" />;
}
