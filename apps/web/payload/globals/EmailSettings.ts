import type { GlobalConfig } from "payload";

export const EmailSettings: GlobalConfig = {
  slug: "email_settings",
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "from_email",
      type: "email",
      admin: { description: "Override za RESEND_FROM_EMAIL env. Prazno = env default." },
    },
    {
      name: "reply_to",
      type: "email",
      admin: { description: "Reply-to adresa (npr. info@vozilla.hr)" },
    },
    {
      name: "templates",
      type: "array",
      labels: { singular: "Email template", plural: "Email template-i" },
      admin: { description: "Po jedan red za svaki email u sustavu" },
      fields: [
        {
          name: "key",
          type: "select",
          required: true,
          options: [
            { label: "Lead potvrda kupcu", value: "lead-confirmation" },
            { label: "Lead → diler", value: "lead-to-dealer" },
            { label: "Magic link tracker", value: "magic-link" },
            { label: "GDPR primljen", value: "gdpr-request-received" },
            { label: "GDPR riješen", value: "gdpr-request-resolved" },
            { label: "Diler password reset", value: "dealer-password-reset" },
            { label: "Admin: novi lead", value: "admin-new-lead-notification" },
            { label: "Diler reminder #1 (24h)", value: "dealer-reminder-1" },
            { label: "Diler reminder #2 (48h)", value: "dealer-reminder-2" },
            { label: "Customer feedback (dan 3)", value: "customer-feedback-3d" },
            { label: "Customer feedback (dan 14)", value: "customer-feedback-14d" },
            { label: "Customer feedback (dan 30)", value: "customer-feedback-30d" },
            { label: "Newsletter potvrda", value: "newsletter-confirm" },
          ],
        },
        { name: "enabled", type: "checkbox", defaultValue: true },
        {
          name: "subject_override",
          type: "text",
          admin: { description: "Ako prazno, koristi default subject iz template-a" },
        },
      ],
    },
  ],
};
