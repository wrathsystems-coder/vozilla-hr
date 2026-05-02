import type { Block } from "payload";

export const DisclaimerBox: Block = {
  slug: "disclaimerBox",
  labels: { singular: "Disclamer", plural: "Disclamer-i" },
  fields: [
    { name: "text", type: "textarea", required: true },
    {
      name: "variant",
      type: "select",
      defaultValue: "warning",
      options: [
        { label: "Upozorenje", value: "warning" },
        { label: "Info", value: "info" },
        { label: "Pravno", value: "legal" },
      ],
    },
  ],
};
