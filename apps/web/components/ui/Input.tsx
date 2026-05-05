import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const baseClasses =
  "w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:bg-surface-muted aria-invalid:border-state-error";

export default function Input({ className, ...rest }: InputProps) {
  return <input className={`${baseClasses} ${className ?? ""}`} {...rest} />;
}
