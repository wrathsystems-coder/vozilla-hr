import type { CollectionConfig } from "payload";

// Sales agents within a dealer. Phase 2 mostly — MVP uses single Dealer
// auth (one login per dealer entity). Schema kept here for forward-compat.

export const DealerUsers: CollectionConfig = {
  slug: "dealer_users",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "dealer", "role", "is_active"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: "dealer", type: "relationship", relationTo: "dealers", required: true },
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "agent",
      options: [
        { label: "Manager", value: "manager" },
        { label: "Sales agent", value: "agent" },
      ],
    },
    { name: "is_active", type: "checkbox", defaultValue: true },
  ],
  timestamps: true,
};
