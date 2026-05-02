---
description: Save current progress (commit + summary in CLAUDE.md Progress Log)
---

# /checkpoint

Save current progress in 6 steps:

1. Check that no unintended changes are uncommitted (`git status`)
2. Run `pnpm test` and `pnpm placeholders:check`
3. If tests pass, create a Conventional Commits commit with descriptive message
4. Update CLAUDE.md "Progress Log" section with a new entry (date, sprint, what was done, decisions)
5. Push to remote (Vercel preview deploys automatically)
6. Brief summary to user: what was done, what's next

Refuse to checkpoint if tests fail — fix first, then checkpoint.
