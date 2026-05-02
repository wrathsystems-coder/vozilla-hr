import type { CollectionConfig } from "payload";

export const Brands: CollectionConfig = {
  slug: "brands",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "country_origin", "is_active", "sort_order"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "ASCII-safe (npr. 'audi', 'skoda', 'vw')" },
    },
    { name: "name", type: "text", required: true },
    {
      name: "country_origin",
      type: "text",
      admin: { description: 'Hrvatski naziv države (npr. "Njemačka", "Češka")' },
    },
    { name: "founded_year", type: "number" },
    {
      name: "logo_path",
      type: "text",
      admin: { description: "Path u /public/branding/brands/ (vlasnik upload-a)" },
    },
    { name: "hero_image_path", type: "text" },
    { name: "description_md", type: "textarea", admin: { description: "Markdown opis marke" } },
    { name: "is_active", type: "checkbox", defaultValue: true },
    { name: "sort_order", type: "number", defaultValue: 0 },
  ],
  timestamps: true,
};
