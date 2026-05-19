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
  { label: "Za partnere", href: "/za-partnere" },
  { label: "Prijava", href: "/partneri/login" },
];

export const primaryCta: NavItem = {
  label: "Zatraži ponudu",
  href: "/zatrazi-ponudu",
};

export type FooterColumn = {
  title: string;
  items: NavItem[];
};

export const footerColumns: FooterColumn[] = [
  {
    title: "Platforma",
    items: [
      { label: "Kako funkcionira", href: "/kako-funkcionira" },
      { label: "O nama", href: "/o-nama" },
      { label: "Kontakt", href: "/kontakt" },
      { label: "Česta pitanja", href: "/cesta-pitanja" },
    ],
  },
  {
    title: "Pravno",
    items: [
      { label: "Opći uvjeti", href: "/opci-uvjeti" },
      { label: "Politika privatnosti", href: "/politika-privatnosti" },
      { label: "Politika kolačića", href: "/politika-kolacica" },
      { label: "Impressum", href: "/impressum" },
      { label: "GDPR zahtjev", href: "/gdpr-zahtjev" },
    ],
  },
  {
    title: "Resursi",
    items: [
      { label: "Kako provjeravamo recenzije", href: "/kako-provjeravamo-recenzije" },
      { label: "Za partnere", href: "/za-partnere" },
    ],
  },
];
