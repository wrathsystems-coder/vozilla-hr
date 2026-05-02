import type { Block } from "payload";

export const HeroImage: Block = {
  slug: "heroImage",
  labels: { singular: "Hero slika", plural: "Hero slike" },
  fields: [
    {
      name: "image_path",
      type: "text",
      required: true,
      admin: { description: "Path u /public/branding/ ili Payload media path" },
    },
    {
      name: "alt",
      type: "text",
      required: true,
      admin: { description: "ALT tekst (a11y obavezno)" },
    },
    { name: "caption", type: "text" },
    { name: "credit", type: "text", admin: { description: 'npr. "Foto: Audi AG"' } },
  ],
};
