import type { Block } from "payload";

export const CtaButton: Block = {
  slug: "ctaButton",
  labels: { singular: "CTA gumb", plural: "CTA gumbi" },
  fields: [
    { name: "label", type: "text", required: true },
    { name: "href", type: "text", required: true },
    {
      name: "variant",
      type: "select",
      defaultValue: "primary",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Ghost", value: "ghost" },
      ],
    },
    { name: "open_in_new_tab", type: "checkbox", defaultValue: false },
  ],
};
