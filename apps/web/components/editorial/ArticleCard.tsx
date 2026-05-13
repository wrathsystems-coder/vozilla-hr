import Link from "next/link";
import type { Article } from "@/payload-types";

/**
 * Card for one article (/savjeti). Hero image falls back to a generic
 * silhouette since articles aren't tied to a specific vehicle.
 */

type Props = { article: Article };

const CATEGORY_LABEL: Record<string, string> = {
  vodici: "Vodiči",
  savjeti: "Savjeti",
  vijesti: "Vijesti",
  tehnologija: "Tehnologija",
};

export default function ArticleCard({ article }: Props) {
  const category = article.category_slug ? CATEGORY_LABEL[article.category_slug] : null;
  return (
    <Link
      href={`/savjeti/${article.slug}`}
      className="border-surface-border bg-surface hover:border-brand-accent group flex h-full flex-col overflow-hidden rounded-md border transition-colors"
    >
      <div className="bg-surface-muted relative aspect-[16/10] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.hero_image_path || "/placeholders/vehicles/sedan.svg"}
          alt={article.title}
          className="text-text-muted h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {category ? (
          <p className="text-text-muted text-xs uppercase tracking-wide">{category}</p>
        ) : null}
        <h3 className="text-text text-base font-semibold">{article.title}</h3>
        {article.excerpt ? (
          <p className="text-text-muted line-clamp-2 text-sm">{article.excerpt}</p>
        ) : null}
      </div>
    </Link>
  );
}
