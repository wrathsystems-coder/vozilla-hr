import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Page } from "@/payload-types";

/**
 * Loader for Payload `pages` collection — used for editorial pages whose
 * content is admin-authored Lexical (e.g. /leasing/vodic, /o-nama,
 * /kontakt). Cached for 1h with the 'pages' tag so the admin can edit
 * a Page and have it propagate via revalidateTag (Sprint 7 wiring).
 */

const ONE_HOUR = 3600;
const TAG = "pages";

export const getPageBySlug = unstable_cache(
  async (slug: string): Promise<Page | null> => {
    const p = await getPayload({ config });
    const r = await p.find({
      collection: "pages",
      where: { slug: { equals: slug }, is_published: { equals: true } },
      limit: 1,
      depth: 0,
    });
    return (r.docs[0] as Page | undefined) ?? null;
  },
  ["pages:by-slug"],
  { tags: [TAG], revalidate: ONE_HOUR },
);
