import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const baseClasses =
  "w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:bg-surface-muted aria-invalid:border-state-error";

export default function Textarea({ className, rows = 4, ...rest }: TextareaProps) {
  return <textarea rows={rows} className={`${baseClasses} ${className ?? ""}`} {...rest} />;
}
