import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Page-level accessibility audit. Runs axe-core 4.x against each
// canonical page template and fails the build on serious/critical
// violations. WCAG 2.1 AA is the target (CLAUDE.md rule #6).
//
// This is the floor — manual screen-reader passes still happen for
// flows that axe can't statically inspect (focus traps, keyboard
// reachability, color contrast in computed pseudo-states).
//
// Excluded rules:
//   - color-contrast: brand HEX is still 'XXX_' placeholder, contrast
//     scoring against undefined colors is noise until Sprint 7 final
//     brand handoff. Flip on once theme.ts has real values.

const A11Y_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const DISABLED_RULES = ["color-contrast"];
const FAIL_SEVERITIES = new Set(["serious", "critical"]);

const PAGES = [
  { name: "home", path: "/" },
  { name: "nova-vozila hub", path: "/nova-vozila" },
  { name: "rabljena-vozila listings", path: "/rabljena-vozila" },
  { name: "lead wizard step 1", path: "/zatrazi-ponudu" },
  { name: "leasing calculator", path: "/leasing/kalkulator" },
  { name: "usporedi empty", path: "/usporedi" },
  { name: "pomoc-pri-izboru intro", path: "/pomoc-pri-izboru" },
  { name: "recenzije index", path: "/recenzije" },
  { name: "savjeti index", path: "/savjeti" },
  { name: "kontakt", path: "/kontakt" },
  { name: "kako-funkcionira", path: "/kako-funkcionira" },
  { name: "cesta-pitanja", path: "/cesta-pitanja" },
  { name: "opci-uvjeti", path: "/opci-uvjeti" },
  { name: "politika-privatnosti", path: "/politika-privatnosti" },
  { name: "gdpr-zahtjev", path: "/gdpr-zahtjev" },
  { name: "dileri login", path: "/dileri/login" },
  { name: "404 catch-all", path: "/nepostojeca-stranica-za-axe" },
];

for (const { name, path } of PAGES) {
  test(`a11y: ${name} (${path})`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });

    const results = await new AxeBuilder({ page })
      .withTags(A11Y_TAGS)
      .disableRules(DISABLED_RULES)
      .analyze();

    const blocking = results.violations.filter((v) => FAIL_SEVERITIES.has(v.impact ?? ""));
    if (blocking.length > 0) {
      // Surface every blocking violation in the assertion message so the
      // developer doesn't need to dig through the HTML report.
      const summary = blocking
        .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes) — ${v.helpUrl}`)
        .join("\n");
      throw new Error(`a11y violations on ${path}:\n${summary}`);
    }
    // Soft-warn on moderate/minor issues so we keep a running ledger.
    const minor = results.violations.filter((v) => !FAIL_SEVERITIES.has(v.impact ?? ""));
    if (minor.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`[a11y:warn] ${path}: ${minor.length} non-blocking violations`);
    }
    expect(blocking).toEqual([]);
  });
}
