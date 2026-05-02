// Hrvatski slug utility — briše dijakritike, lowercase, ASCII-safe.
// CLAUDE.md "Hrvatski specifikum": URL slugs bez dijakritika.

const DIACRITIC_MAP: Record<string, string> = {
  č: "c",
  ć: "c",
  š: "s",
  đ: "d",
  ž: "z",
  Č: "C",
  Ć: "C",
  Š: "S",
  Đ: "D",
  Ž: "Z",
};

export function slugify(input: string): string {
  return input
    .split("")
    .map((char) => DIACRITIC_MAP[char] ?? char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
