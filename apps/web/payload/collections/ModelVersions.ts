import type { CollectionConfig } from "payload";

export const ModelVersions: CollectionConfig = {
  slug: "model_versions",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "model", "year", "power_hp", "is_current"],
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
      name: "name",
      type: "text",
      required: true,
      admin: { description: 'Trim/version label (npr. "2.0 TDI Sport", "1.5 TSI Style")' },
    },
    {
      name: "engine_type",
      type: "select",
      options: [
        { label: "Benzin", value: "benzin" },
        { label: "Dizel", value: "dizel" },
        { label: "Hibrid", value: "hibrid" },
        { label: "Plug-in hibrid", value: "phev" },
        { label: "Električni", value: "ev" },
      ],
    },
    {
      name: "engine_displacement_cc",
      type: "number",
      admin: { description: "Zapremnina u cm³" },
    },
    { name: "power_kw", type: "number" },
    { name: "power_hp", type: "number" },
    {
      name: "transmission",
      type: "select",
      options: [
        { label: "Manualni", value: "manual" },
        { label: "Automatski", value: "automatic" },
        { label: "DCT", value: "dct" },
        { label: "CVT", value: "cvt" },
      ],
    },
    {
      name: "fuel_consumption_combined_l",
      type: "number",
      admin: { description: "L/100km kombinirano (WLTP)" },
    },
    { name: "co2_emission_g_km", type: "number", admin: { description: "g/km (WLTP)" } },
    { name: "price_eur", type: "number" },
    { name: "year", type: "number" },
    { name: "is_current", type: "checkbox", defaultValue: true },
  ],
  timestamps: true,
};
