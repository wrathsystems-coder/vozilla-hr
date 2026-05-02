import { Check, X } from "lucide-react";

type Props = {
  pros?: { text: string }[];
  cons?: { text: string }[];
};

export function ProsCons({ pros, cons }: Props) {
  return (
    <div className="my-8 grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-3 text-lg font-semibold text-green-700">Prednosti</h3>
        <ul className="space-y-2">
          {(pros ?? []).map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-3 text-lg font-semibold text-red-700">Mane</h3>
        <ul className="space-y-2">
          {(cons ?? []).map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
