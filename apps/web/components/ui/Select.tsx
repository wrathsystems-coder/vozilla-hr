import type { ReactNode, SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
};

const baseClasses =
  "w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:bg-surface-muted aria-invalid:border-state-error";

export default function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select className={`${baseClasses} ${className ?? ""}`} {...rest}>
      {children}
    </select>
  );
}
