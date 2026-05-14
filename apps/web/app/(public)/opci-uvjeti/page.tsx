import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Opći uvjeti",
};

export default function OpciUvjetiPage() {
  return <LegalPageShell slug="opci-uvjeti" />;
}
