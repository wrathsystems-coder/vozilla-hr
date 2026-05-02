import type { CollectionConfig } from "payload";

export const BodyTypes: CollectionConfig = {
  slug: "body_types",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "sort_order"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    {
      name: "name",
      type: "text",
      required: true,
      admin: { description: 'Hrvatski naziv (npr. "SUV", "Limuzina", "Karavan")' },
    },
    { name: "description", type: "textarea" },
    {
      name: "icon_svg_path",
      type: "text",
      admin: { description: "Path u /public/placeholders/body-types/" },
    },
    { name: "sort_order", type: "number", defaultValue: 0 },
  ],
};
