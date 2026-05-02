import type { CollectionConfig } from "payload";

// Auth collection for dealer logins. Email + password (Argon2id default).
// Per-dealer agents (DealerUsers) are forward-compat for Phase 2 multi-user.

export const Dealers: CollectionConfig = {
  slug: "dealers",
  auth: {
    useAPIKey: false,
    tokenExpiration: 60 * 60 * 24,
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  admin: {
    useAsTitle: "legal_name",
    defaultColumns: ["legal_name", "is_active", "is_verified", "is_demo"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "legal_name", type: "text", required: true },
    {
      name: "oib",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "OIB, 11 znamenki — checksum validacija u importeru/Zod" },
    },
    {
      name: "phone",
      type: "text",
      required: true,
      admin: { description: 'Format: "+385..." ili "0..."' },
    },
    {
      name: "address",
      type: "group",
      fields: [
        { name: "street", type: "text", required: true },
        { name: "city", type: "text", required: true },
        { name: "postcode", type: "text", required: true },
        {
          name: "county_id",
          type: "number",
          required: true,
          admin: { description: "FK na counties (Drizzle raw, app-level enforcement)" },
        },
        { name: "lat", type: "number" },
        { name: "lng", type: "number" },
      ],
    },
    {
      name: "brands",
      type: "relationship",
      relationTo: "brands",
      hasMany: true,
      admin: { description: "Marke koje dealer prodaje" },
    },
    {
      name: "scoring",
      type: "group",
      admin: { description: "Lead distribution scoring (Sprint 4 algorithm)" },
      fields: [
        {
          name: "monthly_lead_cap",
          type: "number",
          defaultValue: 20,
          admin: { description: "Override za config/lead-distribution.yml default" },
        },
        {
          name: "current_month_leads",
          type: "number",
          defaultValue: 0,
          admin: { readOnly: true },
        },
        { name: "avg_rating", type: "number", defaultValue: 0, admin: { readOnly: true } },
        {
          name: "avg_response_time_hours",
          type: "number",
          defaultValue: 0,
          admin: { readOnly: true },
        },
        { name: "conversion_rate", type: "number", defaultValue: 0, admin: { readOnly: true } },
        {
          name: "throttle_factor",
          type: "number",
          defaultValue: 1.0,
          admin: { description: "1.0 = normal, 0.5 = throttled, 0 = suspended" },
        },
      ],
    },
    { name: "is_active", type: "checkbox", defaultValue: true },
    {
      name: "is_verified",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Verifikacija dokumenata (manual po adminu)" },
    },
    {
      name: "is_demo",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Demo data flag — pnpm seed:cleanup-demo briše ove" },
    },
    {
      name: "suspended_reason",
      type: "text",
      admin: { description: "Razlog suspenzije ako !is_active" },
    },
    { name: "last_login_at", type: "date", admin: { readOnly: true } },
  ],
  timestamps: true,
};
