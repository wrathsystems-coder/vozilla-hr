import type { ReactNode } from "react";

type Level = 1 | 2 | 3 | 4 | 5 | 6;

const sizeByLevel: Record<Level, string> = {
  1: "text-4xl font-bold tracking-tight",
  2: "text-3xl font-bold tracking-tight",
  3: "text-2xl font-semibold",
  4: "text-xl font-semibold",
  5: "text-lg font-medium",
  6: "text-base font-medium",
};

type HeadingProps = {
  level: Level;
  children: ReactNode;
  className?: string;
  id?: string;
};

export default function Heading({ level, children, className, id }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag id={id} className={`${sizeByLevel[level]} ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
