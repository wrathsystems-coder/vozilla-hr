import type { CollectionConfig } from "payload";

export const AdminUsers: CollectionConfig = {
  slug: "admin_users",
  auth: {
    useAPIKey: false,
    tokenExpiration: 60 * 60 * 8, // 8h
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "role", "is_active"],
  },
  access: {
    // Sprint 1 minimum: any logged-in admin can CRUD admins. Granular RBAC ships in Sprint 7.
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "operator",
      options: [
        { label: "Super Admin", value: "super_admin" },
        { label: "Admin", value: "admin" },
        { label: "Operator", value: "operator" },
        { label: "Viewer", value: "viewer" },
      ],
    },
    {
      name: "two_factor_enabled",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "TOTP-based 2FA. Implementation lands in Sprint 7.",
      },
    },
    {
      name: "last_login_at",
      type: "date",
      admin: {
        readOnly: true,
        description: "Set automatically by login hook (Sprint 4).",
      },
    },
    {
      name: "last_login_ip",
      type: "text",
      admin: { readOnly: true },
    },
    {
      name: "is_active",
      type: "checkbox",
      defaultValue: true,
    },
  ],
  timestamps: true,
};
