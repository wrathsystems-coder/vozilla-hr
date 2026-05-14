import type { CollectionConfig } from "payload";

// Spec section 5: "read-only listing + akcije, ne CRUD klasično". Public
// POST hits a custom API route in Sprint 4 (with reCAPTCHA + rate limit
// + Zod validation) and bypasses Payload's standard create flow.
// Admin reads/updates via Payload UI.

export const LeadRequests: CollectionConfig = {
  slug: "lead_requests",
  admin: {
    useAsTitle: "display_id",
    defaultColumns: ["display_id", "customer_name", "request_type", "status", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "public_token",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "UUID za /upit/[token]/ tracker" },
    },
    {
      name: "display_id",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Format: VZ-YYYY-MM-DD-XXXX (auto-generira API)" },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Kupac",
          fields: [
            { name: "customer_name", type: "text", required: true },
            { name: "customer_email", type: "email", required: true },
            {
              name: "customer_phone",
              type: "text",
              required: true,
              admin: { description: "E.164 format (+385...)" },
            },
            {
              name: "customer_county_id",
              type: "number",
              required: true,
              admin: { description: "FK na counties (Drizzle)" },
            },
            { name: "customer_postcode", type: "text", required: true },
            {
              name: "preferred_contact_method",
              type: "select",
              options: [
                { label: "Telefon", value: "phone" },
                { label: "Email", value: "email" },
                { label: "WhatsApp", value: "whatsapp" },
                { label: "Bilo koje", value: "any" },
              ],
            },
            {
              name: "best_contact_time",
              type: "text",
              admin: { description: 'npr. "9-17h", "vikend"' },
            },
          ],
        },
        {
          label: "Vozilo",
          fields: [
            {
              name: "request_type",
              type: "select",
              required: true,
              options: [
                { label: "Novo vozilo", value: "new" },
                { label: "Rabljeno", value: "used" },
                { label: "Leasing", value: "leasing" },
                { label: "Nisam siguran", value: "unsure" },
              ],
            },
            { name: "brand", type: "relationship", relationTo: "brands" },
            { name: "model", type: "relationship", relationTo: "models" },
            {
              name: "version_text",
              type: "text",
              admin: { description: "Trim/varijanta (free text — kupac ne mora znati ID)" },
            },
            { name: "year_from", type: "number" },
            { name: "year_to", type: "number" },
            {
              name: "color_preferences",
              type: "array",
              labels: { singular: "Boja", plural: "Boje" },
              fields: [{ name: "color", type: "text" }],
            },
            { name: "comments", type: "textarea" },
          ],
        },
        {
          label: "Budget i financiranje",
          fields: [
            { name: "price_min", type: "number" },
            { name: "price_max", type: "number" },
            {
              name: "financing_type",
              type: "select",
              options: [
                { label: "Gotovina", value: "cash" },
                { label: "Kredit banke", value: "bank_loan" },
                { label: "Leasing", value: "leasing" },
                { label: "Razmislit ću", value: "undecided" },
              ],
            },
            {
              name: "leasing_type",
              type: "select",
              admin: {
                description: "Vrsta leasinga (ako financing_type === 'leasing')",
                condition: (data) => data?.financing_type === "leasing",
              },
              options: [
                { label: "Operativni leasing", value: "operating" },
                { label: "Financijski leasing", value: "financial" },
              ],
            },
            { name: "deposit", type: "number" },
            { name: "period_months", type: "number" },
            {
              name: "time_frame",
              type: "select",
              options: [
                { label: "Odmah", value: "immediate" },
                { label: "U sljedećih mjesec dana", value: "1m" },
                { label: "U sljedeća 3 mjeseca", value: "3m" },
                { label: "U sljedećih 6 mjeseci", value: "6m" },
                { label: "Više od 6 mjeseci", value: "later" },
              ],
            },
          ],
        },
        {
          label: "Trade-in",
          fields: [
            { name: "has_trade_in", type: "checkbox", defaultValue: false },
            {
              name: "trade_in_data",
              type: "group",
              admin: { condition: (data) => Boolean(data.has_trade_in) },
              fields: [
                { name: "brand", type: "text" },
                { name: "model", type: "text" },
                { name: "year", type: "number" },
                { name: "mileage_km", type: "number" },
                {
                  name: "condition",
                  type: "select",
                  options: [
                    { label: "Odlično", value: "excellent" },
                    { label: "Vrlo dobro", value: "good" },
                    { label: "Dobro", value: "fair" },
                    { label: "Loše", value: "poor" },
                  ],
                },
                { name: "estimated_value_eur", type: "number" },
              ],
            },
          ],
        },
        {
          label: "Privole i meta",
          fields: [
            {
              name: "gdpr_consent_at",
              type: "date",
              required: true,
              admin: { description: "Postavlja API automatski pri submitu" },
            },
            { name: "marketing_consent", type: "checkbox", defaultValue: false },
            {
              name: "source",
              type: "select",
              admin: {
                description:
                  "Mirrors `?izvor=` (CtaSource in lib/catalog/cta.ts). Single source of truth — frontend value goes straight into this column.",
              },
              options: [
                { label: "Header CTA", value: "header" },
                { label: "Nova vozila hub", value: "hub" },
                { label: "Brand stranica", value: "brand" },
                { label: "Kategorija stranica", value: "category" },
                { label: "Model detail", value: "detail" },
                { label: "Recenzija", value: "recenzija" },
                { label: "Usporedba", value: "usporedba" },
                { label: "Quiz", value: "quiz" },
                { label: "Leasing kalkulator", value: "leasing" },
                { label: "Sticky widget", value: "sticky" },
                { label: "Oglas (rabljeno vozilo)", value: "oglas" },
                { label: "Drugo", value: "other" },
              ],
            },
            { name: "recaptcha_score", type: "number", admin: { readOnly: true } },
            { name: "recaptcha_action", type: "text", admin: { readOnly: true } },
            { name: "ip_address", type: "text", admin: { readOnly: true } },
            { name: "user_agent", type: "text", admin: { readOnly: true } },
          ],
        },
        {
          label: "Admin",
          fields: [
            {
              name: "status",
              type: "select",
              required: true,
              defaultValue: "new",
              options: [
                { label: "Novo", value: "new" },
                { label: "Pregled", value: "under_review" },
                { label: "U obradi", value: "in_progress" },
                { label: "Poslano dilerima", value: "sent" },
                { label: "Zatvoreno", value: "closed" },
                { label: "Spam", value: "spam" },
              ],
            },
            { name: "internal_notes", type: "textarea" },
          ],
        },
      ],
    },
  ],
  timestamps: true,
};
