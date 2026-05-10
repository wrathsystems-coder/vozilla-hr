import { expect, test } from "@playwright/test";

// Golden path: customer arrives at the wizard with brand+model pre-filled
// from query params, fills 4 steps, submits, and lands on /uspjeh with a
// VZ-... display id.
//
// Each test run uses a unique email (millisecond timestamp) so the
// per-email rate limit doesn't trip on repeated local runs. Per-IP
// rate limit is 5/15min — running this spec >5 times within 15 minutes
// from the same IP will start producing 429s. RECAPTCHA_SECRET_KEY is
// expected to be empty/XXX_ in dev so the server takes the dev_bypass
// branch (no live Google call).

const DISPLAY_ID_RE = /^VZ-\d{4}-\d{2}-\d{2}-[A-Z2-9]{4}$/;

test("kupac flow: wizard submits and lands on /uspjeh", async ({ page }) => {
  const uniqueEmail = `e2e.lead.${Date.now()}@example.com`;

  await page.goto("/zatrazi-ponudu?marka=audi&model=a4&izvor=detail", { waitUntil: "networkidle" });

  // Step 1 — Vehicle. request_type is the only required field.
  await expect(page.getByRole("heading", { name: "Što tražiš?" })).toBeVisible();
  await page.getByLabel("Novo vozilo").check();
  await page.getByRole("button", { name: "Dalje" }).click();

  // Step 2 — Budget + financing. Only time_frame is mandatory.
  await expect(page.getByRole("heading", { name: "Tvoji uvjeti" })).toBeVisible();
  await page.getByLabel("Vremenski okvir kupnje").selectOption("1m");
  await page.getByRole("button", { name: "Dalje" }).click();

  // Step 3 — Contact. Postcode autofills the county via /api/lookup/postcode.
  await expect(page.getByRole("heading", { name: "Tvoji podaci" })).toBeVisible();
  await page.getByLabel("Ime i prezime").fill("E2E Tester");
  // Use the input id for email — honeypot's "Email (ne popunjavajte…)"
  // label confuses getByLabel even with exact:true.
  await page.locator("#customer_email").fill(uniqueEmail);
  await page.getByLabel("Telefon").fill("0911234567");
  await page.getByLabel("Poštanski broj").fill("10000");

  const countySelect = page.getByLabel("Županija");
  await expect(countySelect).toHaveValue("21", { timeout: 5_000 });

  await page.getByLabel("Preferirani način kontakta").selectOption("email");
  await page.getByRole("button", { name: "Dalje" }).click();

  // Step 4 — Review + consents. GDPR is required.
  await expect(page.getByRole("heading", { name: "Pregled i privole" })).toBeVisible();
  await page.getByRole("checkbox", { name: /Slažem se s/i }).check();

  await Promise.all([
    page.waitForURL(/\/zatrazi-ponudu\/uspjeh\?id=/, { timeout: 15_000 }),
    page.getByRole("button", { name: "Pošalji upit" }).click(),
  ]);

  // Success page surfaces the display_id from the query string.
  await expect(page.getByRole("heading", { name: /Hvala/ })).toBeVisible();
  const url = new URL(page.url());
  const displayId = url.searchParams.get("id") ?? "";
  expect(displayId).toMatch(DISPLAY_ID_RE);
  await expect(page.getByText(displayId)).toBeVisible();
});
