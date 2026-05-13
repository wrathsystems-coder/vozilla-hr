import Link from "next/link";
import Container from "@/components/ui/Container";
import { mainNav, primaryCta, secondaryNav } from "./nav-items";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";
import SearchOverlay from "./SearchOverlay";
import { getAllBodyTypes, getTopBrandsForMegaMenu } from "@/lib/catalog/fetch";

const NOVA_VOZILA_HREF = "/nova-vozila";

async function loadMegaMenuData() {
  // Header renders on every (public) page; if Payload is unreachable (e.g.
  // local build without DATABASE_URL, or transient DB hiccup) we degrade to
  // empty lists rather than 500 the whole site. MegaMenu/MobileNav both
  // render usable empty states.
  try {
    const [topBrands, bodyTypes] = await Promise.all([
      getTopBrandsForMegaMenu(20),
      getAllBodyTypes(),
    ]);
    return { topBrands, bodyTypes };
  } catch (err) {
    console.warn("Header: mega-menu data unavailable, falling back to empty.", err);
    return { topBrands: [], bodyTypes: [] };
  }
}

export default async function Header() {
  const { topBrands, bodyTypes } = await loadMegaMenuData();

  return (
    <header className="border-surface-border bg-surface sticky top-0 z-50 border-b">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          aria-label="vozilla.hr — početna"
          className="focus-visible:outline-brand-accent text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          vozilla.hr
        </Link>

        <nav aria-label="Glavna navigacija" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {mainNav.map((item) =>
              item.href === NOVA_VOZILA_HREF ? (
                <MegaMenu
                  key={item.href}
                  label={item.label}
                  topBrands={topBrands}
                  bodyTypes={bodyTypes}
                />
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-text hover:text-brand-accent focus-visible:outline-brand-accent text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <SearchOverlay />
          <ul className="flex items-center gap-4">
            {secondaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-text-muted hover:text-text focus-visible:outline-brand-accent text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={primaryCta.href}
            className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent rounded-md px-4 py-2 text-sm font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {primaryCta.label}
          </Link>
        </div>

        <MobileNav topBrands={topBrands} bodyTypes={bodyTypes} />
      </Container>
    </header>
  );
}
