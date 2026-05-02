---
description: Scaffold a new public page following project conventions
argument-hint: <slug> (e.g. /new-page kontakt)
---

# /new-page

Create a new public page using the standard template:

1. Create `apps/web/app/(public)/{slug}/page.tsx` with placeholder content
2. Create matching Payload Page entry with `[XXX_*]` content placeholders
3. Verify it appears in the auto-generated sitemap
4. Add breadcrumb support
5. Set SEO meta defaults (h1 → title, first 160 chars → description)
6. Schema.org BreadcrumbList markup
7. Test render locally at `/{slug}/`
8. Update `docs/PLACEHOLDERS.md` if new XXX values were added
