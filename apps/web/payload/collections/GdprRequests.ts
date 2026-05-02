import type { CollectionConfig } from "payload";

export const GdprRequests: CollectionConfig = {
  slug: "gdpr_requests",
  admin: {
    useAsTitle: "display_id",
    defaultColumns: ["display_id", "customer_email", "request_type", "status", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "display_id",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Format: GDPR-YYYY-XXXX (auto-generira API)" },
    },
    { name: "customer_email", type: "email", required: true },
    { name: "customer_name", type: "text", required: true },
    {
      name: "customer_oib",
      type: "text",
      admin: { description: "OIB, opcijski (validira se ako popunjeno)" },
    },
    {
      name: "request_type",
      type: "select",
      required: true,
      options: [
        { label: "Pravo pristupa", value: "access" },
        { label: "Brisanje (zaborav)", value: "erasure" },
        { label: "Ispravak", value: "rectification" },
        { label: "Prenosivost podataka", value: "portability" },
        { label: "Prigovor", value: "objection" },
      ],
    },
    {
      name: "lead_request",
      type: "relationship",
      relationTo: "lead_requests",
      admin: { description: "Povezani lead (ako postoji)" },
    },
    { name: "description", type: "textarea" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Na čekanju", value: "pending" },
        { label: "U obradi", value: "in_progress" },
        { label: "Riješeno", value: "resolved" },
        { label: "Odbijeno", value: "rejected" },
      ],
    },
    { name: "admin_notes", type: "textarea" },
    { name: "resolved_at", type: "date" },
    {
      name: "resolved_by",
      type: "relationship",
      relationTo: "admin_users",
      admin: { description: "Admin koji je obradio zahtjev" },
    },
    { name: "ip_address", type: "text", admin: { readOnly: true } },
    { name: "recaptcha_score", type: "number", admin: { readOnly: true } },
  ],
  timestamps: true,
};
