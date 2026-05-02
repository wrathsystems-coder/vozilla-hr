import type { CollectionConfig } from "payload";

// Storage adapter swap (Supabase Storage / S3) ships in Sprint 7. Sprint 1
// uses local filesystem in apps/web/payload/media/ (gitignored).

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: "media",
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    imageSizes: [
      { name: "thumbnail", width: 320 },
      { name: "card", width: 640 },
      { name: "feature", width: 1024 },
      { name: "hero", width: 1920 },
    ],
  },
  admin: {
    useAsTitle: "alt",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: { description: "ALT tekst (HR, a11y obavezno)" },
    },
    {
      name: "source",
      type: "select",
      required: true,
      defaultValue: "vlastite",
      options: [
        { label: "Vlastite", value: "vlastite" },
        { label: "Press kit", value: "press_kit" },
        { label: "Diller upload", value: "dealer_uploaded" },
        { label: "Stock photo", value: "stock_photo" },
      ],
    },
    { name: "credit_text", type: "text", admin: { description: 'npr. "Foto: Audi AG"' } },
    { name: "license_url", type: "text" },
  ],
};
