import type { Metadata } from "next";
import Link from "next/link";
import { eq, gt, and } from "drizzle-orm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getDb } from "@/lib/db/client";
import { quizResults } from "@/lib/db/schema/quizResults";
import { matchPercent, MAX_SCORE, recommendModels, type QuizAnswers } from "@/lib/quiz-recommender";
import { fetchModelsForRecommender, hydrateRecommendedModels } from "@/lib/quiz/fetch";
import { requestQuoteHref } from "@/lib/catalog/cta";
import { formatPrice } from "@/lib/utils/format";
import { now } from "@/lib/utils/time";

export const dynamic = "force-dynamic";

type Params = { token: string };

export const metadata: Metadata = {
  title: "Tvoje preporuke",
  // Token URL — never index, never follow. Strict referrer keeps the
  // token out of outbound link tracking.
  robots: { index: false, follow: false, nocache: true },
  referrer: "strict-origin",
};

const TOP_N = 10;

async function loadQuiz(token: string) {
  if (token.length < 32 || token.length > 128) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(quizResults)
    .where(and(eq(quizResults.token, token), gt(quizResults.expiresAt, now())))
    .limit(1);
  return rows[0] ?? null;
}

export default async function QuizResultsPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;
  const row = await loadQuiz(token);

  if (!row) {
    return <ExpiredOrInvalid />;
  }

  // Re-score against current catalog rather than blindly trusting the
  // snapshot — a model deactivated since the quiz was taken shouldn't
  // appear. Snapshot exists for analytics, not for stable rendering.
  const answers = row.answers as QuizAnswers;
  const catalog = await fetchModelsForRecommender();
  const scored = recommendModels(answers, catalog).slice(0, TOP_N);

  // Hydrate model details from Payload. Order preserved from `scored`.
  const ids = scored.map((s) => s.modelId);
  const hydrated = await hydrateRecommendedModels(ids);
  const cards = scored
    .map((s) => {
      const m = hydrated.find((h) => h.id === s.modelId);
      return m ? { ...m, score: s.score } : null;
    })
    .filter(<T,>(v: T | null): v is T => v !== null);

  return (
    <>
      <section className="bg-surface py-10">
        <Container>
          <Breadcrumbs
            items={[
              { name: "Početna", href: "/" },
              { name: "Pomoć pri izboru", href: "/pomoc-pri-izboru" },
              { name: "Rezultati" },
            ]}
            className="mb-6"
          />
          <Heading level={1}>Tvoje preporuke</Heading>
          <p className="text-text-muted mt-3 max-w-2xl text-base">
            {cards.length === 0
              ? "Tvoji odgovori ne odgovaraju trenutnom katalogu — pokušaj opet s manje strogim kriterijima."
              : `Top ${cards.length} modela koji najbolje odgovaraju tvojim odgovorima. Bodovi do ${MAX_SCORE} (svako pitanje dodaje između 5 i 20 bodova).`}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/pomoc-pri-izboru"
              className="bg-surface-muted text-text hover:bg-surface-border inline-block rounded-md px-4 py-2 text-sm font-medium"
            >
              ← Pokušaj ponovno
            </Link>
          </div>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          {cards.length === 0 ? (
            <EmptyState />
          ) : (
            <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c, i) => (
                <li key={c.id}>
                  <ResultCard rank={i + 1} model={c} />
                </li>
              ))}
            </ol>
          )}
        </Container>
      </section>
    </>
  );
}

function ResultCard({
  rank,
  model,
}: {
  rank: number;
  model: {
    id: number;
    name: string;
    slug: string;
    brandName: string;
    brandSlug: string;
    basePriceEur: number | null;
    bodyTypeSlug: string | null;
    heroImagePath: string | null;
    score: number;
  };
}) {
  const pct = matchPercent(model.score);
  return (
    <article className="border-surface-border bg-surface flex h-full flex-col overflow-hidden rounded-md border">
      <div className="bg-surface-muted relative aspect-[16/10] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            model.heroImagePath || `/placeholders/vehicles/${model.bodyTypeSlug ?? "limuzina"}.svg`
          }
          alt={`${model.brandName} ${model.name}`}
          className="text-text-muted h-full w-full object-contain p-6"
          loading="lazy"
        />
        <div className="bg-brand-accent text-brand-primary absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold">
          {pct}% match
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-text-muted text-xs">
          #{rank} · {model.brandName}
        </p>
        <h3 className="text-text text-base font-semibold">{model.name}</h3>
        <p className="text-text-muted text-sm">
          {model.basePriceEur != null
            ? `Od ${formatPrice(model.basePriceEur, { decimals: 0 })}`
            : "Cijena: na upit"}
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Link
            href={requestQuoteHref({
              brand: model.brandSlug,
              model: model.slug,
              source: "quiz",
            })}
            className="bg-brand-accent text-brand-primary block rounded-md px-3 py-2 text-center text-sm font-semibold hover:opacity-90"
          >
            Zatraži ponudu
          </Link>
          <Link
            href={`/nova-vozila/marke/${model.brandSlug}/${model.slug}`}
            className="text-text-muted hover:text-text block text-center text-xs underline"
          >
            Vidi detalje modela
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="border-surface-border bg-surface rounded-md border p-8 text-center">
      <Heading level={2} className="text-lg">
        Nismo pronašli odgovarajuće modele
      </Heading>
      <p className="text-text-muted mt-2 text-sm">
        Tvoji odgovori su vrlo specifični ili katalog još nije popunjen za tu kombinaciju.
      </p>
      <Link
        href="/pomoc-pri-izboru"
        className="bg-brand-accent text-brand-primary mt-4 inline-block rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90"
      >
        Pokušaj ponovno
      </Link>
    </div>
  );
}

function ExpiredOrInvalid() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-xl text-center">
        <Heading level={1}>Rezultati nisu dostupni</Heading>
        <p className="text-text-muted mt-3 text-base">
          Link je istekao ili nije ispravan. Rezultati kviza vrijede 30 dana. Pokreni kviz ponovno i
          dobit ćeš novi link.
        </p>
        <Link
          href="/pomoc-pri-izboru"
          className="bg-brand-accent text-brand-primary mt-6 inline-block rounded-md px-5 py-3 text-sm font-semibold hover:opacity-90"
        >
          Pokreni kviz
        </Link>
      </div>
    </Container>
  );
}
