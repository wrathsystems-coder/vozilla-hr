import type { Block } from "payload";

export const ProsCons: Block = {
  slug: "prosCons",
  labels: { singular: "Prednosti i mane", plural: "Prednosti i mane" },
  fields: [
    {
      name: "pros",
      type: "array",
      labels: { singular: "Prednost", plural: "Prednosti" },
      fields: [{ name: "text", type: "text", required: true }],
    },
    {
      name: "cons",
      type: "array",
      labels: { singular: "Mana", plural: "Mane" },
      fields: [{ name: "text", type: "text", required: true }],
    },
  ],
};
