import type { CollectionConfig } from "payload";
import { makeCollectionRevalidateHooks } from "@/lib/payload/revalidate-hook";

// Used for static pages: O nama, Kontakt, Kako funkcionira, FAQ,
// legal pages (Opći uvjeti, Politika privatnosti, Politika kolačića).
// Sprint 2 seeds these with [XXX_*] placeholders for owner/lawyer to fill.

const revalidate = makeCollectionRevalidateHooks(["pages"]);

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "is_published"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return { is_published: { equals: true } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "title", type: "text", required: true },
    { name: "content", type: "richText" },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "og_image_path", type: "text" },
      ],
    },
    { name: "is_published", type: "checkbox", defaultValue: false },
  ],
  timestamps: true,
};
