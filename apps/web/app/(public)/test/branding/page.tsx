import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

const colorTokens: { name: string; cssVar: string; hex: string }[] = [
  { name: "brand-primary", cssVar: "--color-brand-primary", hex: "#000000" },
  { name: "brand-accent", cssVar: "--color-brand-accent", hex: "#FFC107" },
  { name: "text", cssVar: "--color-text", hex: "#0A0A0A" },
  { name: "text-muted", cssVar: "--color-text-muted", hex: "#525252" },
  { name: "text-inverse", cssVar: "--color-text-inverse", hex: "#FFFFFF" },
  { name: "surface", cssVar: "--color-surface", hex: "#FFFFFF" },
  { name: "surface-muted", cssVar: "--color-surface-muted", hex: "#F5F5F5" },
  { name: "surface-border", cssVar: "--color-surface-border", hex: "#E5E5E5" },
  { name: "state-success", cssVar: "--color-state-success", hex: "#16A34A" },
  { name: "state-warning", cssVar: "--color-state-warning", hex: "#EAB308" },
  { name: "state-error", cssVar: "--color-state-error", hex: "#DC2626" },
  { name: "state-info", cssVar: "--color-state-info", hex: "#2563EB" },
];

const variants = ["primary", "secondary", "ghost"] as const;
const sizes = ["sm", "md", "lg"] as const;

export default function BrandingPlaygroundPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="py-12">
      <header className="mb-12">
        <Heading level={1}>/test/branding playground</Heading>
        <p className="text-text-muted mt-2">
          Dev-only stranica. Renderira theme tokene i UI primitive da brzo provjeriš da brand
          vrijednosti i komponente rade kako treba.
        </p>
      </header>

      <section className="mb-16">
        <Heading level={2}>Boje</Heading>
        <p className="text-text-muted mt-2 text-sm">
          Mirror <code>config/theme.ts</code> → <code>apps/web/app/globals.css</code> @theme blok.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {colorTokens.map((token) => (
            <div key={token.name} className="flex flex-col">
              <div
                className="border-surface-border h-20 w-full rounded-md border"
                style={{ backgroundColor: `var(${token.cssVar})` }}
                aria-hidden="true"
              />
              <div className="mt-2">
                <p className="text-text text-sm font-medium">{token.name}</p>
                <p className="text-text-muted font-mono text-xs">{token.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <Heading level={2}>Tipografija</Heading>
        <div className="mt-6 space-y-4">
          <Heading level={1}>Heading 1 — najveći</Heading>
          <Heading level={2}>Heading 2</Heading>
          <Heading level={3}>Heading 3</Heading>
          <Heading level={4}>Heading 4</Heading>
          <Heading level={5}>Heading 5</Heading>
          <Heading level={6}>Heading 6 — najmanji</Heading>
          <p className="text-text text-base">
            Body tekst — standardni paragraf. Hrvatski znakovi: čćšđž ČĆŠĐŽ.
          </p>
          <p className="text-text-muted text-sm">
            Pomoćni / muted tekst za napomene, captionе, helper poruke.
          </p>
          <p className="text-text font-mono text-sm">
            Mono — za kod, OIB, IBAN, tehničke vrijednosti.
          </p>
        </div>
      </section>

      <section className="mb-16">
        <Heading level={2}>Button — varijante × veličine</Heading>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-surface-border border-b">
                <th className="text-text py-2 pr-4 text-sm font-semibold">variant ↓ / size →</th>
                {sizes.map((size) => (
                  <th key={size} className="text-text py-2 pr-4 text-sm font-semibold">
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant} className="border-surface-border border-b">
                  <td className="text-text-muted py-3 pr-4 font-mono text-sm">{variant}</td>
                  {sizes.map((size) => (
                    <td key={size} className="py-3 pr-4">
                      <Button variant={variant} size={size}>
                        Klik
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="text-text-muted py-3 pr-4 font-mono text-sm">disabled</td>
                {sizes.map((size) => (
                  <td key={size} className="py-3 pr-4">
                    <Button variant="primary" size={size} disabled>
                      Klik
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-16">
        <Heading level={2}>Form elementi</Heading>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="demo-input" className="text-text block text-sm font-medium">
              Input — default
            </label>
            <Input id="demo-input" type="text" placeholder="Tvoj tekst" className="mt-1" />
          </div>
          <div>
            <label htmlFor="demo-input-error" className="text-text block text-sm font-medium">
              Input — aria-invalid
            </label>
            <Input
              id="demo-input-error"
              type="email"
              defaultValue="krivo@"
              aria-invalid
              aria-describedby="demo-input-error-msg"
              className="mt-1"
            />
            <p id="demo-input-error-msg" className="text-state-error mt-1 text-xs">
              Email nije valjan.
            </p>
          </div>
          <div>
            <label htmlFor="demo-input-disabled" className="text-text block text-sm font-medium">
              Input — disabled
            </label>
            <Input
              id="demo-input-disabled"
              type="text"
              disabled
              defaultValue="Ne može se urediti"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="demo-select" className="text-text block text-sm font-medium">
              Select
            </label>
            <Select id="demo-select" className="mt-1" defaultValue="">
              <option value="" disabled>
                Odaberi…
              </option>
              <option value="audi">Audi</option>
              <option value="bmw">BMW</option>
              <option value="skoda">Škoda</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="demo-textarea" className="text-text block text-sm font-medium">
              Textarea
            </label>
            <Textarea
              id="demo-textarea"
              rows={4}
              placeholder="Opiši što tražiš…"
              className="mt-1"
            />
          </div>
        </div>
      </section>

      <section className="mb-16">
        <Heading level={2}>Card</Heading>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <Heading level={4}>Naslov kartice</Heading>
            <p className="text-text-muted mt-2 text-sm">
              Default Card — rounded, border-surface-border, bg-surface, p-6. Koristi se za vehicle
              cards, recenzije, dealer info.
            </p>
          </Card>
          <Card className="bg-surface-muted">
            <Heading level={4}>Card s muted background</Heading>
            <p className="text-text-muted mt-2 text-sm">
              Override className-om. Korisno za visual grouping.
            </p>
          </Card>
        </div>
      </section>
    </Container>
  );
}
