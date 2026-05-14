import type { CollectionConfig } from "payload";
import { makeCollectionRevalidateHooks } from "@/lib/payload/revalidate-hook";

const revalidate = makeCollectionRevalidateHooks(["used_car_listings"]);

export const UsedCarListings: CollectionConfig = {
  slug: "used_car_listings",
  admin: {
    useAsTitle: "public_id",
    defaultColumns: ["public_id", "model", "year", "mileage_km", "price_eur", "status"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return { status: { equals: "active" } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    {
      name: "public_id",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "Slug-friendly id za URL (importer auto-generira)" },
    },
    { name: "model", type: "relationship", relationTo: "models", required: true },
    { name: "dealer", type: "relationship", relationTo: "dealers" },
    {
      name: "private_seller_data",
      type: "group",
      admin: {
        condition: (data) => !data.dealer,
        description: "Popunjeno samo za privatne prodavače (kad dealer nije postavljen)",
      },
      fields: [
        { name: "name", type: "text" },
        { name: "phone", type: "text" },
        { name: "email", type: "email" },
        { name: "city", type: "text" },
      ],
    },
    { name: "year", type: "number", required: true },
    { name: "mileage_km", type: "number", required: true },
    { name: "price_eur", type: "number", required: true },
    { name: "color", type: "text" },
    {
      name: "vin",
      type: "text",
      admin: { description: "VIN — opcijski. Sprint 7 šifrira u prod-u." },
    },
    {
      name: "condition",
      type: "select",
      required: true,
      defaultValue: "good",
      options: [
        { label: "Odlično", value: "excellent" },
        { label: "Vrlo dobro", value: "good" },
        { label: "Dobro", value: "fair" },
        { label: "Loše", value: "poor" },
      ],
    },
    { name: "description_md", type: "textarea" },
    {
      name: "location",
      type: "group",
      fields: [
        {
          name: "county_id",
          type: "number",
          required: true,
          admin: { description: "FK na counties (Drizzle)" },
        },
        { name: "city", type: "text", required: true },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Nacrt", value: "draft" },
        { label: "Aktivan", value: "active" },
        { label: "Prodano", value: "sold" },
        { label: "Isteklo", value: "expired" },
      ],
    },
    { name: "sold_at", type: "date" },
    { name: "expires_at", type: "date" },
    { name: "view_count", type: "number", defaultValue: 0, admin: { readOnly: true } },
    { name: "is_demo", type: "checkbox", defaultValue: false },
  ],
  timestamps: true,
};
