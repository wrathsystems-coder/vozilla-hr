import Link from "next/link";
import type { BodyType } from "@/payload-types";

type Props = {
  bodyType: BodyType;
  className?: string;
};

export default function CategoryCard({ bodyType, className }: Props) {
  const iconPath = bodyType.icon_svg_path ?? "/placeholders/vehicles/default.svg";

  return (
    <Link
      href={`/nova-vozila/kategorije/${bodyType.slug}`}
      className={`border-surface-border bg-surface focus-visible:outline-brand-accent group flex flex-col items-center gap-3 rounded-md border p-6 text-center transition-colors hover:border-current focus-visible:outline-2 focus-visible:outline-offset-2 ${className ?? ""}`}
      aria-label={`Pregledaj kategoriju ${bodyType.name}`}
    >
      <span
        className="text-text-muted group-hover:text-brand-accent inline-block w-32 transition-colors"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconPath} alt="" width={200} height={80} className="h-auto w-full" />
      </span>
      <span className="text-text text-base font-semibold">{bodyType.name}</span>
    </Link>
  );
}
