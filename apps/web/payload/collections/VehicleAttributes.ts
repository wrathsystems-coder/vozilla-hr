import type { CollectionConfig } from "payload";

// Flexible key-value catalog. Per Sprint 1 decision: each row is one
// (model, attr_key, attr_value, attr_unit) tuple. Examples:
//   { model: 42, attr_key: "Prtljažnik", attr_value: "480", attr_unit: "L" }
//   { model: 42, attr_key: "Razmak osovina", attr_value: "2700", attr_unit: "mm" }

export const VehicleAttributes: CollectionConfig = {
  slug: "vehicle_attributes",
  admin: {
    useAsTitle: "attr_key",
    defaultColumns: ["model", "attr_key", "attr_value", "attr_unit", "display_order"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: "model", type: "relationship", relationTo: "models", required: true },
    {
      name: "attr_key",
      type: "text",
      required: true,
      admin: { description: 'Naziv atributa (npr. "Prtljažnik", "Razmak osovina")' },
    },
    {
      name: "attr_value",
      type: "text",
      required: true,
      admin: { description: 'Vrijednost (npr. "480", "2700")' },
    },
    {
      name: "attr_unit",
      type: "text",
      admin: { description: 'Mjerna jedinica (npr. "L", "mm", "kg")' },
    },
    { name: "display_order", type: "number", defaultValue: 0 },
  ],
};
