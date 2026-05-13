import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import type { Article } from "@/payload-types";

/**
 * /savjeti/ — editorial guides + tips. Same fetcher shape as reviews:
 * paginated list (PAGE_SIZE=25), by-slug, by-category, latest-N.
 */

const ONE_HOUR = 3600;
const TAG = "articles";
const PAGE_SIZE = 25;

export type ArticleCategory = NonNullable<Article["category_slug"]>;

async function payload() {
  return getPayload({ config });
}

export type ArticleListResult = {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
};

async function listUncached(
  page: number,
  categorySlug?: ArticleCategory,
): Promise<ArticleListResult> {
  const p = await payload();
  const where: Where = { is_published: { equals: true } };
  if (categorySlug) where.category_slug = { equals: categorySlug };
  const result = await p.find({
    collection: "articles",
    where,
    sort: "-published_at",
    page,
    limit: PAGE_SIZE,
    depth: 1,
  });
  return {
    articles: result.docs as Article[],
    total: result.totalDocs,
    page: result.page ?? page,
    totalPages: result.totalPages,
  };
}

export async function listArticles(
  page = 1,
  categorySlug?: ArticleCategory,
): Promise<ArticleListResult> {
  const key = `${page}:${categorySlug ?? ""}`;
  const cached = unstable_cache(() => listUncached(page, categorySlug), ["articles:list", key], {
    tags: [TAG],
    revalidate: ONE_HOUR,
  });
  return cached();
}

export const getArticleBySlug = unstable_cache(
  async (slug: string): Promise<Article | null> => {
    const p = await payload();
    const result = await p.find({
      collection: "articles",
      where: { slug: { equals: slug }, is_published: { equals: true } },
      limit: 1,
      depth: 1,
    });
    return (result.docs[0] as Article | undefined) ?? null;
  },
  ["articles:by-slug"],
  { tags: [TAG], revalidate: ONE_HOUR },
);

export async function listLatestArticles(limit = 4): Promise<Article[]> {
  const cached = unstable_cache(
    async () => {
      const p = await payload();
      const result = await p.find({
        collection: "articles",
        where: { is_published: { equals: true } },
        sort: "-published_at",
        limit,
        depth: 1,
      });
      return result.docs as Article[];
    },
    ["articles:latest", String(limit)],
    { tags: [TAG], revalidate: ONE_HOUR },
  );
  return cached();
}
