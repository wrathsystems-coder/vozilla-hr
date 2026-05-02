import type { GlobalConfig } from "payload";

export const LeasingDefaults: GlobalConfig = {
  slug: "leasing_defaults",
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "interest_rates",
      type: "group",
      fields: [
        {
          name: "default_rate_percent",
          type: "number",
          defaultValue: 5.5,
          admin: { description: "Default godišnja kamata (NKS)" },
        },
        { name: "min_rate_percent", type: "number", defaultValue: 3.0 },
        { name: "max_rate_percent", type: "number", defaultValue: 12.0 },
      ],
    },
    {
      name: "term_months",
      type: "group",
      fields: [
        { name: "default", type: "number", defaultValue: 60 },
        { name: "min", type: "number", defaultValue: 12 },
        { name: "max", type: "number", defaultValue: 84 },
      ],
    },
    {
      name: "deposit_percent",
      type: "group",
      fields: [
        { name: "default", type: "number", defaultValue: 20 },
        { name: "min", type: "number", defaultValue: 0 },
        { name: "max", type: "number", defaultValue: 50 },
      ],
    },
    {
      name: "residual_value_percent",
      type: "group",
      fields: [
        {
          name: "default",
          type: "number",
          defaultValue: 30,
          admin: { description: "Ostatak vrijednosti na kraju leasinga" },
        },
      ],
    },
    {
      name: "disclaimer",
      type: "textarea",
      defaultValue:
        "Informativni izračun. Konačnu ponudu radi banka/leasing kuća na temelju vaše kreditne sposobnosti.",
      admin: { description: "HANFA disclamer iznad rezultata kalkulatora" },
    },
  ],
};
