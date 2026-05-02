type Row = { label: string; value: string; unit?: string };

type Props = {
  // Sprint 3: when set, fetch ModelVersion fields and merge into rows.
  model_version?: number | null;
  manual_rows?: Row[];
};

export function SpecsTable({ manual_rows }: Props) {
  const rows = manual_rows ?? [];
  if (rows.length === 0) return null;
  return (
    <table className="my-6 w-full border-collapse">
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-200">
            <th className="py-2 pr-4 text-left text-sm font-medium text-gray-700">{row.label}</th>
            <td className="py-2 text-sm text-gray-900">
              {row.value}
              {row.unit && <span className="text-gray-500"> {row.unit}</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
