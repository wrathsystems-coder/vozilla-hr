import type { CollectionConfig } from "payload";

// UNIQUE (brand, slug) is enforced at app layer (importer + Zod) per
// Sprint 1 decision. Payload doesn't support compound unique on
// relationship fields out of the box.

export const Models: CollectionConfig = {
  slug: "models",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "brand", "body_type", "is_active"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: "brand", type: "relationship", relationTo: "brands", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      admin: { description: "ASCII-safe per-brand jedinstven (npr. 'a4', 'octavia', 'golf')" },
    },
    { name: "name", type: "text", required: true },
    { name: "body_type", type: "relationship", relationTo: "body_types", required: true },
    {
      name: "segment",
      type: "select",
      options: [
        { label: "A — Mini", value: "A" },
        { label: "B — Small", value: "B" },
        { label: "C — Compact", value: "C" },
        { label: "D — Mid-size", value: "D" },
        { label: "E — Executive", value: "E" },
        { label: "F — Luxury", value: "F" },
        { label: "J — SUV/Crossover", value: "J" },
        { label: "M — MPV", value: "M" },
        { label: "S — Sports", value: "S" },
      ],
    },
    { name: "generation", type: "text", admin: { description: 'npr. "B9", "Mk7", "T-Roc"' } },
    { name: "year_from", type: "number" },
    { name: "year_to", type: "number" },
    {
      name: "base_price_eur",
      type: "number",
      admin: { description: "Početna cijena (EUR)" },
    },
    {
      name: "fuel_types",
      type: "select",
      hasMany: true,
      options: [
        { label: "Benzin", value: "benzin" },
        { label: "Dizel", value: "dizel" },
        { label: "Hibrid", value: "hibrid" },
        { label: "Plug-in hibrid", value: "phev" },
        { label: "Električni", value: "ev" },
        { label: "LPG", value: "lpg" },
        { label: "CNG", value: "cng" },
      ],
    },
    {
      name: "transmissions",
      type: "select",
      hasMany: true,
      options: [
        { label: "Manualni", value: "manual" },
        { label: "Automatski", value: "automatic" },
        { label: "DCT", value: "dct" },
        { label: "CVT", value: "cvt" },
      ],
    },
    { name: "description_md", type: "textarea" },
    { name: "hero_image_path", type: "text" },
    { name: "is_active", type: "checkbox", defaultValue: true },
    { name: "sort_order", type: "number", defaultValue: 0 },
  ],
  timestamps: true,
};
