import Link from "next/link";

type Props = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  open_in_new_tab?: boolean;
};

const variantClasses: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-black text-white hover:bg-gray-800",
  secondary: "border border-gray-300 bg-white text-black hover:bg-gray-50",
  ghost: "text-black hover:bg-gray-100",
};

export function CtaButton({ label, href, variant = "primary", open_in_new_tab }: Props) {
  const classes = `inline-flex items-center justify-center rounded px-5 py-2.5 text-sm font-medium transition ${variantClasses[variant]}`;
  if (open_in_new_tab) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  );
}
