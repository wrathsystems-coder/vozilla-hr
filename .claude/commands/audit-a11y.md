---
description: Run accessibility audit on a single page (Sprint 7+)
argument-hint: <path> (e.g. /audit-a11y /nova-vozila)
---

# /audit-a11y

Run accessibility audit on the specified path. axe-core integration ships in Sprint 7;
in earlier sprints, this command should report "axe-core not yet installed" and exit.

1. Run axe-core against the rendered page
2. Output all violations grouped by severity (serious / critical / moderate / minor)
3. Propose fixes for the most critical issues
4. Update `docs/accessibility.md` if the violation reveals a recurring pattern
