import type { CollectionConfig } from "payload";

export const UsedCarImages: CollectionConfig = {
  slug: "used_car_images",
  admin: {
    defaultColumns: ["listing", "media", "is_hero", "sort_order"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: "listing", type: "relationship", relationTo: "used_car_listings", required: true },
    { name: "media", type: "relationship", relationTo: "media", required: true },
    { name: "is_hero", type: "checkbox", defaultValue: false },
    { name: "sort_order", type: "number", defaultValue: 0 },
  ],
};
