import type { CollectionConfig } from "payload";
import { makeCollectionRevalidateHooks } from "@/lib/payload/revalidate-hook";

const revalidate = makeCollectionRevalidateHooks(["reviews"]);

export const Reviews: CollectionConfig = {
  slug: "reviews",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "model", "is_published", "published_at"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return { is_published: { equals: true } };
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
    { name: "slug", type: "text", required: true, unique: true },
    { name: "title", type: "text", required: true },
    { name: "model", type: "relationship", relationTo: "models" },
    { name: "author", type: "relationship", relationTo: "admin_users" },
    {
      name: "content",
      type: "richText",
      admin: {
        description: "Lexical editor s blockovima (Hero, SpecsTable, ProsCons, CTA, Disclaimer)",
      },
    },
    {
      name: "scores",
      type: "group",
      fields: [
        { name: "overall", type: "number", min: 1, max: 10 },
        { name: "design", type: "number", min: 1, max: 10 },
        { name: "comfort", type: "number", min: 1, max: 10 },
        { name: "drive", type: "number", min: 1, max: 10 },
        { name: "economy", type: "number", min: 1, max: 10 },
        { name: "value", type: "number", min: 1, max: 10 },
      ],
    },
    {
      name: "pros",
      type: "array",
      fields: [{ name: "text", type: "text", required: true }],
    },
    {
      name: "cons",
      type: "array",
      fields: [{ name: "text", type: "text", required: true }],
    },
    { name: "hero_image_path", type: "text" },
    {
      name: "gallery",
      type: "array",
      fields: [
        { name: "image_path", type: "text", required: true },
        { name: "alt", type: "text", required: true },
        { name: "caption", type: "text" },
      ],
    },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "og_image_path", type: "text" },
      ],
    },
    { name: "is_published", type: "checkbox", defaultValue: false },
    { name: "published_at", type: "date" },
    {
      name: "view_count",
      type: "number",
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
};
