import type { Block } from "payload";

export const SpecsTable: Block = {
  slug: "specsTable",
  labels: { singular: "Tablica specifikacija", plural: "Tablice specifikacija" },
  fields: [
    {
      name: "model_version",
      type: "relationship",
      relationTo: "model_versions",
      admin: {
        description: "Auto-povlači WLTP/specs. Ostavi prazno za ručni unos preko 'manual_rows'.",
      },
    },
    {
      name: "manual_rows",
      type: "array",
      labels: { singular: "Red", plural: "Redovi" },
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
        { name: "unit", type: "text" },
      ],
    },
  ],
};
