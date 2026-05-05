import Link from "next/link";
import { now } from "@/lib/utils/time";
import { footerColumns } from "./nav-items";

export default function Footer() {
  const year = now().getFullYear();

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <Link
              href="/"
              aria-label="vozilla.hr — početna"
              className="text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-500"
            >
              vozilla.hr
            </Link>
            <p className="mt-3 text-sm text-gray-600">[XXX_TAGLINE: 8-12 riječi]</p>

            <form aria-label="Pretplata na newsletter" className="mt-6">
              <label htmlFor="newsletter-email" className="block text-xs font-medium text-gray-500">
                Newsletter (uskoro)
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="newsletter-email"
                  type="email"
                  disabled
                  placeholder="vaš@email.hr"
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled
                  className="rounded-md bg-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 disabled:cursor-not-allowed"
                >
                  Pretplati se
                </button>
              </div>
            </form>
          </div>

          <nav aria-label="Podnožje" className="md:col-span-3">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h2 className="text-sm font-semibold text-gray-900">{column.title}</h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {column.items.map((item) => (
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
                </div>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>© {year} vozilla.hr. Sva prava pridržana.</p>
        </div>
      </div>
    </footer>
  );
}
