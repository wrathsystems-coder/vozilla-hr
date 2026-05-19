import { Search, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getMarketingCopy } from "@/lib/marketing/copy";

// Reads from MarketingCopy global (admin → Payload → Settings →
// Marketing copy → Value props). Default trio shown when nothing is
// authored yet, keyed to the same `[XXX_*]` markers the original stub
// emitted so placeholder-check still picks them up.

const FALLBACK_ITEMS: Array<{ title: string; body: string; iconName: string }> = [
  {
    title: "[XXX_VP_1_TITLE: 3-5 riječi]",
    body: "[XXX_VP_1_BODY: 1-2 rečenice]",
    iconName: "search",
  },
  {
    title: "[XXX_VP_2_TITLE: 3-5 riječi]",
    body: "[XXX_VP_2_BODY: 1-2 rečenice]",
    iconName: "shield-check",
  },
  {
    title: "[XXX_VP_3_TITLE: 3-5 riječi]",
    body: "[XXX_VP_3_BODY: 1-2 rečenice]",
    iconName: "wallet",
  },
];

// Small registry — keeps icons tree-shakeable. Adding more icons is a
// one-line addition once we know which lucide names admin will use.
const ICON_REGISTRY: Record<string, LucideIcon> = {
  search: Search,
  "shield-check": ShieldCheck,
  shield: ShieldCheck,
  wallet: Wallet,
};

export default async function ValueProps() {
  const { valueProps } = await getMarketingCopy();
  const items =
    valueProps.length > 0
      ? valueProps.map((v) => ({
          title: v.title,
          body: v.description,
          iconName: (v.iconName ?? "shield-check").toLowerCase(),
        }))
      : FALLBACK_ITEMS;

  return (
    <section className="bg-surface-muted py-16">
      <Container>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item) => {
            const Icon = ICON_REGISTRY[item.iconName] ?? ShieldCheck;
            return (
              <Card key={item.title}>
                <Icon className="text-brand-accent h-8 w-8" aria-hidden="true" />
                <Heading level={3} className="mt-4">
                  {item.title}
                </Heading>
                <p className="text-text-muted mt-2 text-sm">{item.body}</p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
