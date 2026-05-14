import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Politika kolačića",
};

export default function PolitikaKolacicaPage() {
  return <LegalPageShell slug="politika-kolacica" />;
}
