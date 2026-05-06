import type { Metadata } from "next";
import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Opći uvjeti",
};

export default function OpciUvjetiPage() {
  return (
    <LegalPageShell title="Opći uvjeti" contentPlaceholder="[XXX_OUP_TEKST: pravnik dostavlja]" />
  );
}
