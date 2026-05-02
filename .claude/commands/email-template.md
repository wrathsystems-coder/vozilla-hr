---
description: Scaffold a new React Email template
argument-hint: <name> (e.g. /email-template lead-confirmation)
---

# /email-template

Create a new React Email template:

1. File `apps/web/emails/{name}.tsx`
2. Use the shared `_layout.tsx` wrapper (Tailwind in emails via `<Tailwind>` component)
3. Default content with `[XXX_*]` placeholders for body text
4. Preview at `/admin/email-preview/{name}` (Sprint 4 routes)
5. Feature flag entry in `EmailSettings` global if the email is optional
6. Update `docs/email-templates.md` (new file in Sprint 4) with the template purpose
