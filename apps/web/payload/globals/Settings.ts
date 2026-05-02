import type { GlobalConfig } from "payload";

// Mirrors config/company.yml at runtime. Sprint 4+ lookup: Payload first,
// fall back to YAML defaults if a field is empty.

export const Settings: GlobalConfig = {
  slug: "settings",
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "brand",
      type: "group",
      fields: [
        { name: "site_name", type: "text", required: true, defaultValue: "vozilla.hr" },
        { name: "tagline", type: "text", admin: { description: "[XXX_TAGLINE: 8-12 riječi]" } },
        {
          name: "logo_path",
          type: "text",
          admin: { description: "Path u /public/branding/" },
        },
        {
          name: "logo_dark_path",
          type: "text",
          admin: { description: "Dark theme verzija (Phase 2)" },
        },
        { name: "favicon_path", type: "text" },
      ],
    },
    {
      name: "contact",
      type: "group",
      fields: [
        {
          name: "email_general",
          type: "email",
          admin: { description: "[XXX_CONTACT_EMAIL_GENERAL]" },
        },
        {
          name: "email_dpo",
          type: "email",
          admin: { description: "[XXX_CONTACT_EMAIL_DPO] — GDPR/privacy" },
        },
        {
          name: "email_dealers",
          type: "email",
          admin: { description: "[XXX_CONTACT_EMAIL_DEALERS]" },
        },
        { name: "phone", type: "text", admin: { description: "Format: +385..." } },
        {
          name: "address_line",
          type: "text",
          admin: { description: "Composite za footer/email signature" },
        },
      ],
    },
    {
      name: "social",
      type: "group",
      fields: [
        { name: "facebook_url", type: "text" },
        { name: "instagram_url", type: "text" },
        { name: "linkedin_url", type: "text" },
        { name: "youtube_url", type: "text" },
      ],
    },
    {
      name: "seo_defaults",
      type: "group",
      fields: [
        { name: "title_template", type: "text", defaultValue: "%s — vozilla.hr" },
        {
          name: "description",
          type: "textarea",
          admin: { description: "Default site description, 150-160 znakova" },
        },
        {
          name: "og_image_path",
          type: "text",
          admin: { description: "Default OG image (1200×630)" },
        },
      ],
    },
  ],
};
