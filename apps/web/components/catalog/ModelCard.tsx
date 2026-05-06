import Link from "next/link";
import type { ModelWithRefs } from "@/lib/catalog/fetch";
import { formatPrice } from "@/lib/utils/format";

type Props = {
  model: ModelWithRefs;
  className?: string;
  showBrand?: boolean;
};

export default function ModelCard({ model, className, showBrand = true }: Props) {
  const href = `/nova-vozila/marke/${model.brand.slug}/${model.slug}`;
  const fallbackIcon = model.body_type.icon_svg_path ?? "/placeholders/vehicles/default.svg";

  return (
    <Link
      href={href}
      className={`border-surface-border bg-surface focus-visible:outline-brand-accent group flex flex-col rounded-md border transition-colors hover:border-current focus-visible:outline-2 focus-visible:outline-offset-2 ${className ?? ""}`}
      aria-label={`${model.brand.name} ${model.name} — pregled modela`}
    >
      <div className="bg-surface-muted text-text-muted group-hover:text-brand-accent flex aspect-[5/3] items-center justify-center rounded-t-md p-6 transition-colors">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fallbackIcon}
          alt=""
          width={200}
          height={80}
          aria-hidden="true"
          className="h-auto w-full max-w-[160px]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {showBrand && (
          <span className="text-text-muted text-xs uppercase tracking-wide">
            {model.brand.name}
          </span>
        )}
        <span className="text-text text-base font-semibold">{model.name}</span>
        <span className="text-text-muted text-sm">{model.body_type.name}</span>
        {typeof model.base_price_eur === "number" && (
          <span className="text-text mt-1 text-sm font-medium">
            od {formatPrice(model.base_price_eur, { decimals: 0 })}
          </span>
        )}
      </div>
    </Link>
  );
}
