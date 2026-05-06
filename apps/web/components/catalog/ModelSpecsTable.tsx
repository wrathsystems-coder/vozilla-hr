import type { ModelVersion } from "@/payload-types";
import { formatPrice } from "@/lib/utils/format";

const FUEL_LABELS: Record<NonNullable<ModelVersion["engine_type"]>, string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  hibrid: "Hibrid",
  phev: "Plug-in hibrid",
  ev: "Električni",
};

const TRANSMISSION_LABELS: Record<NonNullable<ModelVersion["transmission"]>, string> = {
  manual: "Manualni",
  automatic: "Automatski",
  dct: "DCT",
  cvt: "CVT",
};

type Props = {
  versions: ModelVersion[];
};

export default function ModelSpecsTable({ versions }: Props) {
  if (versions.length === 0) {
    return (
      <p className="text-text-muted text-sm">
        Detaljne specifikacije po verzijama bit će dostupne uskoro.
      </p>
    );
  }

  return (
    <div className="border-surface-border overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-text-muted text-left">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Verzija
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Pogon
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Snaga
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Mjenjač
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Potrošnja
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              CO₂
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Cijena
            </th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.id} className="border-surface-border border-t">
              <td className="text-text px-4 py-3 font-medium">
                {v.name}
                {v.year && <span className="text-text-muted ml-2 text-xs">{v.year}.</span>}
              </td>
              <td className="text-text px-4 py-3">
                {v.engine_type ? FUEL_LABELS[v.engine_type] : "—"}
                {v.engine_displacement_cc && (
                  <span className="text-text-muted ml-1 text-xs">
                    {v.engine_displacement_cc} cm³
                  </span>
                )}
              </td>
              <td className="text-text px-4 py-3">
                {v.power_hp ? `${v.power_hp} KS` : "—"}
                {v.power_kw && (
                  <span className="text-text-muted ml-1 text-xs">({v.power_kw} kW)</span>
                )}
              </td>
              <td className="text-text px-4 py-3">
                {v.transmission ? TRANSMISSION_LABELS[v.transmission] : "—"}
              </td>
              <td className="text-text px-4 py-3">
                {v.fuel_consumption_combined_l ? `${v.fuel_consumption_combined_l} L/100km` : "—"}
              </td>
              <td className="text-text px-4 py-3">
                {typeof v.co2_emission_g_km === "number" ? `${v.co2_emission_g_km} g/km` : "—"}
              </td>
              <td className="text-text px-4 py-3 font-medium">
                {typeof v.price_eur === "number" ? formatPrice(v.price_eur, { decimals: 0 }) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
