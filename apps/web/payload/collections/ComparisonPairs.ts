import type { CollectionConfig } from "payload";

export const ComparisonPairs: CollectionConfig = {
  slug: "comparison_pairs",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "model_a", "model_b", "is_published", "sort_order"],
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
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: 'Format: "model-a-vs-model-b" (npr. "golf-vs-octavia")' },
    },
    { name: "title", type: "text", required: true },
    { name: "model_a", type: "relationship", relationTo: "models", required: true },
    { name: "model_b", type: "relationship", relationTo: "models", required: true },
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
    { name: "sort_order", type: "number", defaultValue: 0 },
  ],
  timestamps: true,
};
