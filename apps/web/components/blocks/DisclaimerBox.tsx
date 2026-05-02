import { AlertTriangle, Info, Scale } from "lucide-react";

type Props = {
  text: string;
  variant?: "warning" | "info" | "legal";
};

const variantConfig = {
  warning: {
    Icon: AlertTriangle,
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    iconColor: "text-yellow-600",
  },
  info: {
    Icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-300",
    iconColor: "text-blue-600",
  },
  legal: {
    Icon: Scale,
    bg: "bg-gray-50",
    border: "border-gray-300",
    iconColor: "text-gray-600",
  },
} as const;

export function DisclaimerBox({ text, variant = "warning" }: Props) {
  const config = variantConfig[variant];
  const Icon = config.Icon;
  return (
    <div className={`my-6 flex items-start gap-3 rounded border p-4 ${config.bg} ${config.border}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconColor}`} aria-hidden="true" />
      <p className="text-sm text-gray-800">{text}</p>
    </div>
  );
}
