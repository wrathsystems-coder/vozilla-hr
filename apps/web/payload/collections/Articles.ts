import type { CollectionConfig } from "payload";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category_slug", "is_published", "published_at"],
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
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "title", type: "text", required: true },
    {
      name: "category_slug",
      type: "select",
      options: [
        { label: "Vodiči", value: "vodici" },
        { label: "Savjeti", value: "savjeti" },
        { label: "Vijesti", value: "vijesti" },
        { label: "Tehnologija", value: "tehnologija" },
      ],
    },
    { name: "author", type: "relationship", relationTo: "admin_users" },
    {
      name: "excerpt",
      type: "textarea",
      admin: { description: "Kratki sažetak (~160 znakova) za listinge i SEO" },
    },
    { name: "content", type: "richText" },
    { name: "hero_image_path", type: "text" },
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
    { name: "published_at", type: "date" },
    {
      name: "view_count",
      type: "number",
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
};
