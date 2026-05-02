import { notFound } from "next/navigation";

export default function BrandingPlaygroundPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">/test/branding playground</h1>
      <p className="mt-2 text-gray-600">
        Sprint 0 placeholder. Komponente, paleta, tipografija dodaju se u Sprintu 2.
      </p>
    </div>
  );
}
