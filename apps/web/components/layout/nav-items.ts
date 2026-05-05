export type NavItem = {
  label: string;
  href: string;
};

export const mainNav: NavItem[] = [
  { label: "Nova vozila", href: "/nova-vozila" },
  { label: "Rabljena vozila", href: "/rabljena-vozila" },
  { label: "Leasing", href: "/leasing" },
  { label: "Usporedi", href: "/usporedi" },
  { label: "Recenzije", href: "/recenzije" },
  { label: "Savjeti", href: "/savjeti" },
  { label: "Pomoć pri izboru", href: "/pomoc-pri-izboru" },
];

export const secondaryNav: NavItem[] = [
  { label: "Za dilere", href: "/za-dilere" },
  { label: "Prijava", href: "/dileri/login" },
];

export const primaryCta: NavItem = {
  label: "Zatraži ponudu",
  href: "/zatrazi-ponudu",
};
