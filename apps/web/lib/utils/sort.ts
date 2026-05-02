// Hrvatska abeceda sortiranje. CLAUDE.md "Hrvatski specifikum".
// Default Intl.Collator with locale "hr" follows the Croatian alphabet:
// a, b, c, č, ć, d, dž, đ, e, f, g, h, i, j, k, l, lj, m, n, nj, o, p, r, s, š, t, u, v, z, ž
// Using sensitivity "accent" so case is ignored but diacritics matter.

export const hrCollator = new Intl.Collator("hr", { sensitivity: "accent" });

export function sortHr<T>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => {
    const av = String(a[key] ?? "");
    const bv = String(b[key] ?? "");
    return hrCollator.compare(av, bv);
  });
}
