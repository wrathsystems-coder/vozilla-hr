import type { GlobalConfig } from "payload";
import { makeGlobalRevalidateHook } from "@/lib/payload/revalidate-hook";

export const MarketingCopy: GlobalConfig = {
  slug: "marketing_copy",
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [makeGlobalRevalidateHook(["marketing_copy"])],
  },
  fields: [
    {
      name: "hero",
      type: "group",
      fields: [
        {
          name: "headline",
          type: "text",
          admin: { description: "[XXX_HERO_HEADLINE: 5-8 riječi]" },
        },
        { name: "subheadline", type: "text" },
        { name: "primary_cta_label", type: "text", defaultValue: "Zatraži ponudu" },
        { name: "primary_cta_href", type: "text", defaultValue: "/zatrazi-ponudu" },
        { name: "hero_image_path", type: "text" },
      ],
    },
    {
      name: "value_props",
      type: "array",
      labels: { singular: "Value prop", plural: "Value props" },
      maxRows: 4,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea" },
        {
          name: "icon_name",
          type: "text",
          admin: { description: 'lucide-react ikona, npr. "check", "shield", "trending-up"' },
        },
      ],
    },
    {
      name: "how_it_works",
      type: "array",
      labels: { singular: "Korak", plural: "Koraci" },
      maxRows: 3,
      fields: [
        { name: "step_number", type: "number", required: true },
        { name: "title", type: "text", required: true },
        { name: "description", type: "textarea" },
      ],
    },
    {
      name: "testimonials",
      type: "array",
      labels: { singular: "Testimonial", plural: "Testimonials" },
      fields: [
        { name: "quote", type: "textarea", required: true },
        { name: "author_name", type: "text", required: true },
        { name: "author_role", type: "text" },
      ],
    },
  ],
};
