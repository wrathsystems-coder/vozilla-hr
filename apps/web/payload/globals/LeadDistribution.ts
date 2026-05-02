import type { GlobalConfig } from "payload";

// Runtime override za config/lead-distribution.yml. Sprint 4 algoritam
// čita Payload prvi, fallback na YAML.

export const LeadDistribution: GlobalConfig = {
  slug: "lead_distribution",
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "weights",
      type: "group",
      admin: { description: "Težine za quality_score (kod normalizira sumu)" },
      fields: [
        {
          name: "w_response",
          type: "number",
          defaultValue: 0.4,
          admin: { description: "1 / avg_response_time_h" },
        },
        {
          name: "w_conversion",
          type: "number",
          defaultValue: 0.3,
          admin: { description: "conversion_rate" },
        },
        {
          name: "w_rating",
          type: "number",
          defaultValue: 0.2,
          admin: { description: "avg_rating / 5" },
        },
        {
          name: "w_capacity",
          type: "number",
          defaultValue: 0.1,
          admin: { description: "1 - current_load_ratio" },
        },
      ],
    },
    {
      name: "rules",
      type: "group",
      fields: [
        {
          name: "closest_dealer_always_included",
          type: "checkbox",
          defaultValue: true,
          admin: { description: "Carwow pravilo" },
        },
        { name: "max_dealers_per_lead", type: "number", defaultValue: 5 },
        { name: "default_dealers_per_lead", type: "number", defaultValue: 5 },
        { name: "min_dealers_per_lead", type: "number", defaultValue: 3 },
      ],
    },
    {
      name: "throttling",
      type: "group",
      fields: [
        { name: "max_leads_per_dealer_per_day", type: "number", defaultValue: 20 },
        { name: "max_leads_per_dealer_per_week", type: "number", defaultValue: 80 },
      ],
    },
    {
      name: "reminders",
      type: "group",
      fields: [
        { name: "first_reminder_hours", type: "number", defaultValue: 24 },
        { name: "second_reminder_hours", type: "number", defaultValue: 48 },
        { name: "expire_no_response_hours", type: "number", defaultValue: 72 },
      ],
    },
    {
      name: "score_thresholds",
      type: "group",
      fields: [
        { name: "warn_below", type: "number", defaultValue: 0.3 },
        { name: "suspend_below", type: "number", defaultValue: 0.15 },
      ],
    },
  ],
};
