---
description: Run performance audit on a single page (Sprint 7+)
argument-hint: <path> (e.g. /audit-perf /)
---

# /audit-perf

Run performance audit on the specified path. Lighthouse integration ships in Sprint 7;
in earlier sprints, this command should report "Lighthouse not yet installed" and exit.

1. Run Lighthouse against the path
2. Output Core Web Vitals and category scores (Performance, A11y, BP, SEO)
3. Identify bottlenecks (LCP, INP, CLS)
4. Propose optimizations
5. Measure bundle size with `next/bundle-analyzer`
