import { describe, expect, it } from "vitest";
import { getLegalPage, listLegalSlugs } from "@/lib/legal/pages";

describe("legal pages registry", () => {
  it("returns the entry for each known slug", () => {
    const oup = getLegalPage("opci-uvjeti");
    expect(oup?.title).toBe("Opći uvjeti");
    expect(oup?.slug).toBe("opci-uvjeti");
    expect(oup?.placeholder).toContain("XXX_");
  });

  it("returns entries for all 3 lawyer-supplied pages", () => {
    expect(getLegalPage("opci-uvjeti")).toBeTruthy();
    expect(getLegalPage("politika-privatnosti")).toBeTruthy();
    expect(getLegalPage("politika-kolacica")).toBeTruthy();
  });

  it("returns null for unknown slugs", () => {
    expect(getLegalPage("impressum")).toBeNull();
    expect(getLegalPage("opci-uvjeti-pdf")).toBeNull();
    expect(getLegalPage("")).toBeNull();
  });

  it("listLegalSlugs returns the 3 lawyer-supplied slugs", () => {
    const slugs = listLegalSlugs();
    expect(slugs).toHaveLength(3);
    expect(slugs).toContain("opci-uvjeti");
    expect(slugs).toContain("politika-privatnosti");
    expect(slugs).toContain("politika-kolacica");
  });

  it("does not allow prototype pollution via __proto__ lookups", () => {
    expect(getLegalPage("__proto__")).toBeNull();
    expect(getLegalPage("constructor")).toBeNull();
  });
});
