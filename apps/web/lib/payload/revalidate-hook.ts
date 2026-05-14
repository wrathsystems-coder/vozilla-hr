import { revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload";

// Build Payload afterChange/afterDelete hooks that bust the named cache
// tags so editor changes propagate to ISR-cached pages immediately
// (default revalidate window is 1h — too slow for editorial work).
//
// Tag taxonomy lives in the fetcher modules (lib/catalog/fetch.ts,
// lib/reviews/fetch.ts, etc.) — wherever an unstable_cache call lists
// `tags: [...]`. Keep this hook's tag list in sync with consumers.

function safeRevalidate(tags: readonly string[], context: string): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch (err) {
      // revalidateTag throws if called outside the Next.js request scope —
      // e.g. during a Payload migration that happens to fire collection
      // hooks. Log and continue so the underlying write isn't blocked.
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[payload-revalidate] ${context} tags=${tags.join(",")} → ${message}`);
    }
  }
}

export function makeCollectionRevalidateHooks(tags: readonly string[]): {
  afterChange: CollectionAfterChangeHook;
  afterDelete: CollectionAfterDeleteHook;
} {
  const afterChange: CollectionAfterChangeHook = ({ doc, collection }) => {
    safeRevalidate(tags, `${collection.slug}.afterChange`);
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = ({ doc, collection }) => {
    safeRevalidate(tags, `${collection.slug}.afterDelete`);
    return doc;
  };
  return { afterChange, afterDelete };
}

export function makeGlobalRevalidateHook(tags: readonly string[]): GlobalAfterChangeHook {
  return ({ doc, global }) => {
    safeRevalidate(tags, `${global.slug}.afterChange`);
    return doc;
  };
}
