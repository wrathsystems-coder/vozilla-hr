import Link from "next/link";
import { mainNav, primaryCta, secondaryNav } from "./nav-items";
import MobileNav from "./MobileNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="vozilla.hr — početna"
          className="text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-500"
        >
          vozilla.hr
        </Link>

        <nav aria-label="Glavna navigacija" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-gray-900 hover:text-yellow-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-500"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <ul className="flex items-center gap-4">
            {secondaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-500"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={primaryCta.href}
            className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
          >
            {primaryCta.label}
          </Link>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
