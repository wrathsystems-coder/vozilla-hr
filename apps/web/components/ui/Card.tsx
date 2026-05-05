import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className }: CardProps) {
  return (
    <div className={`border-surface-border bg-surface rounded-md border p-6 ${className ?? ""}`}>
      {children}
    </div>
  );
}
