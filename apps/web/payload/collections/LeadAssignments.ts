import type { CollectionConfig } from "payload";

// UNIQUE (lead, dealer) enforced at app layer per Sprint 1 decision —
// Payload doesn't support compound unique on relationship fields.

export const LeadAssignments: CollectionConfig = {
  slug: "lead_assignments",
  admin: {
    defaultColumns: ["lead", "dealer", "status", "outcome", "sent_at"],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: "lead", type: "relationship", relationTo: "lead_requests", required: true },
    { name: "dealer", type: "relationship", relationTo: "dealers", required: true },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "sent",
      options: [
        { label: "Poslano", value: "sent" },
        { label: "Pregledano", value: "viewed" },
        { label: "Kontaktirano", value: "contacted" },
        { label: "Zatvoreno", value: "closed" },
      ],
    },
    { name: "sent_at", type: "date" },
    { name: "viewed_at", type: "date" },
    { name: "contacted_at", type: "date" },
    { name: "closed_at", type: "date" },
    {
      name: "outcome",
      type: "select",
      options: [
        { label: "Prodano", value: "sold" },
        { label: "Nije prodano", value: "not_sold" },
        { label: "Kupac ne odgovara", value: "customer_unresponsive" },
        { label: "Drugo", value: "other" },
      ],
    },
    { name: "outcome_reason", type: "textarea" },
    { name: "dealer_notes", type: "textarea" },
    {
      name: "customer_feedback",
      type: "group",
      admin: { description: "Popunjava se kroz feedback flow (dani 3, 14, 30 — Sprint 4)" },
      fields: [
        { name: "marked_interested", type: "checkbox", defaultValue: false },
        { name: "marked_not_interested", type: "checkbox", defaultValue: false },
        { name: "rating_for_dealer", type: "number", min: 1, max: 5 },
        { name: "feedback_text", type: "textarea" },
      ],
    },
    {
      name: "reminders",
      type: "group",
      fields: [
        { name: "first_reminder_sent_at", type: "date" },
        { name: "second_reminder_sent_at", type: "date" },
        { name: "expired_no_response", type: "checkbox", defaultValue: false },
      ],
    },
  ],
  timestamps: true,
};
