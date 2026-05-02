import type { GlobalConfig } from "payload";

export const WidgetSettings: GlobalConfig = {
  slug: "widget_settings",
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "sticky_widget",
      type: "group",
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: true },
        {
          name: "position",
          type: "select",
          defaultValue: "bottom-right",
          options: [
            { label: "Desno dolje", value: "bottom-right" },
            { label: "Lijevo dolje", value: "bottom-left" },
          ],
        },
        {
          name: "triggers",
          type: "group",
          fields: [
            { name: "delay_seconds", type: "number", defaultValue: 8 },
            { name: "scroll_percent", type: "number", defaultValue: 40 },
          ],
        },
        {
          name: "dismissal",
          type: "group",
          fields: [{ name: "remember_for_hours", type: "number", defaultValue: 24 }],
        },
        {
          name: "excluded_paths",
          type: "array",
          fields: [{ name: "path", type: "text" }],
          defaultValue: [
            { path: "/admin/*" },
            { path: "/dileri/*" },
            { path: "/upit/*" },
            { path: "/zatrazi-ponudu" },
            { path: "/gdpr-zahtjev" },
            { path: "/opci-uvjeti" },
            { path: "/politika-privatnosti" },
            { path: "/politika-kolacica" },
            { path: "/impressum" },
          ],
        },
      ],
    },
  ],
};
