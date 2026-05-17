import type { CollectionConfig } from "payload";
import { makeCollectionRevalidateHooks } from "@/lib/payload/revalidate-hook";

const revalidate = makeCollectionRevalidateHooks(["model_versions"]);

export const ModelVersions: CollectionConfig = {
  slug: "model_versions",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "model", "year", "power_hp", "is_current"],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
  },
  fields: [
    { name: "model", type: "relationship", relationTo: "models", required: true },
    {
      name: "name",
      type: "text",
      required: true,
      admin: { description: 'Trim/version label (npr. "2.0 TDI Sport", "1.5 TSI Style")' },
    },
    {
      name: "engine_type",
      type: "select",
      options: [
        { label: "Benzin", value: "benzin" },
        { label: "Dizel", value: "dizel" },
        { label: "Hibrid", value: "hibrid" },
        { label: "Plug-in hibrid", value: "phev" },
        { label: "Električni", value: "ev" },
      ],
    },
    {
      name: "engine_displacement_cc",
      type: "number",
      admin: { description: "Zapremnina u cm³" },
    },
    { name: "power_kw", type: "number" },
    { name: "power_hp", type: "number" },
    {
      name: "transmission",
      type: "select",
      options: [
        { label: "Manualni", value: "manual" },
        { label: "Automatski", value: "automatic" },
        { label: "DCT", value: "dct" },
        { label: "CVT", value: "cvt" },
      ],
    },
    {
      name: "fuel_consumption_combined_l",
      type: "number",
      admin: { description: "L/100km kombinirano (WLTP)" },
    },
    { name: "co2_emission_g_km", type: "number", admin: { description: "g/km (WLTP)" } },
    { name: "price_eur", type: "number" },
    { name: "year", type: "number" },
    // Sprint 8 catalog faza — extended spec columns za faceted search filter.
    // Single source of truth za new-car catalog filterable atribute.
    { name: "max_speed_kmh", type: "number", admin: { description: "Maks. brzina (km/h)" } },
    {
      name: "acceleration_0_100_s",
      type: "number",
      admin: { description: "Ubrzanje 0-100 km/h (sek, npr. 7.2)" },
    },
    { name: "boot_capacity_l", type: "number", admin: { description: "Prtljažnik (L, seats up)" } },
    { name: "weight_kg", type: "number", admin: { description: "Curb weight (kg)" } },
    { name: "length_mm", type: "number", admin: { description: "Duljina (mm)" } },
    { name: "width_mm", type: "number", admin: { description: "Širina (mm, bez retrovizora)" } },
    { name: "height_mm", type: "number", admin: { description: "Visina (mm)" } },
    { name: "wheelbase_mm", type: "number", admin: { description: "Razmak osovina (mm)" } },
    { name: "doors_count", type: "number", admin: { description: "Broj vrata (3/4/5)" } },
    { name: "seats_count", type: "number", admin: { description: "Broj sjedala (2/4/5/7)" } },
    {
      name: "drivetrain",
      type: "select",
      options: [
        { label: "Prednji pogon (FWD)", value: "fwd" },
        { label: "Stražnji pogon (RWD)", value: "rwd" },
        { label: "Pogon na sve kotače (AWD)", value: "awd" },
        { label: "4x4 (selectable)", value: "4x4" },
      ],
    },
    {
      name: "equipment",
      type: "select",
      hasMany: true,
      admin: {
        description: "Multi-value oprema — filter koristi AND (vozilo mora imati sve odabrane).",
      },
      options: [
        { label: "Panoramski krov", value: "panorama" },
        { label: "Head-Up Display", value: "hud" },
        { label: "Grijana sjedala", value: "heated_seats" },
        { label: "Ventilirana sjedala", value: "ventilated_seats" },
        { label: "Kožna sjedala", value: "leather_seats" },
        { label: "Električna sjedala", value: "electric_seats" },
        { label: "Adaptivni tempomat", value: "adaptive_cruise" },
        { label: "Lane assist", value: "lane_assist" },
        { label: "Blind spot", value: "blind_spot" },
        { label: "360° kamera", value: "camera_360" },
        { label: "Parkirni senzori", value: "parking_sensors" },
        { label: "LED matrix farovi", value: "led_matrix" },
        { label: "Bežično punjenje", value: "wireless_charging" },
        { label: "Apple CarPlay", value: "apple_carplay" },
        { label: "Android Auto", value: "android_auto" },
        { label: "Premium audio", value: "premium_audio" },
      ],
    },
    {
      name: "colors_available",
      type: "select",
      hasMany: true,
      admin: { description: "Boje dostupne za ovaj trim (multi-select)" },
      options: [
        { label: "Bijela", value: "white" },
        { label: "Crna", value: "black" },
        { label: "Siva", value: "grey" },
        { label: "Srebrna", value: "silver" },
        { label: "Plava", value: "blue" },
        { label: "Crvena", value: "red" },
        { label: "Zelena", value: "green" },
        { label: "Smeđa", value: "brown" },
        { label: "Žuta", value: "yellow" },
        { label: "Narančasta", value: "orange" },
        { label: "Bež", value: "beige" },
      ],
    },
    { name: "is_current", type: "checkbox", defaultValue: true },
  ],
  timestamps: true,
};
