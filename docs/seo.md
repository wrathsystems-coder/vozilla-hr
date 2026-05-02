# SEO — vozilla.hr

> Skeleton. Full audit and tactics document in Sprint 7.

## Goals

- Rank for "[brand] Hrvatska", "kupnja [brand] [model]", "leasing [model]"
- Compete with auto.hr, njuškalo, autonet for vehicle research queries
- Capture long-tail "[model] vs [model]" via pre-generated comparison pages

## Tactics

- **Schema.org markup**: Organization, Vehicle, Review, BreadcrumbList,
  FAQPage, Article, WebSite + SearchAction
- **ISR for catalog pages** (revalidate hourly) so content stays fresh
  without hitting build queue
- **Pre-generated comparison pages** (top 50 pairs) for "[a] vs [b]"
  long-tail queries
- **Croatian-first content** with proper diacritics in body text;
  ASCII-safe URL slugs (CLAUDE.md "Hrvatski specifikum")
- **hreflang="hr"** everywhere; future i18n already prepared
- Sitemap auto-generated at `/sitemap.xml`, robots at `/robots.txt`

## Technical checklist

See `pre-launch-checklist.md` "SEO" section.

## Content strategy

> TODO: keyword research log, content calendar (Sprint 2+).

## Competitive landscape

- **auto.hr** — informativni portal, dominates research queries
- **njuškalo** — listings only, weak on content
- **autonet, auto-kreso, autoplac** — listings, weak SEO
- **Direktni dileri** (BMW HR, VW HR) — branded queries only

vozilla.hr differentiation: media + lead-gen + listings on one Croatian-native domain.

## TODO

- [ ] Sprint 3: catalog page SEO audit
- [ ] Sprint 6: comparison page SEO audit
- [ ] Sprint 7: full pre-launch SEO audit
- [ ] Post-launch: monthly Search Console review, query analysis
