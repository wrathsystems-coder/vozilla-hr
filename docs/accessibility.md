# Accessibility — vozilla.hr

WCAG 2.1 AA is **minimum**, not aspiration. CLAUDE.md rule #6.

## Standards

- Forms: `<label for>` or `aria-label`, error messages via `aria-describedby`,
  `<fieldset>`/`<legend>` for grouped inputs
- Images: ALT text mandatory (Payload media field is required)
- Keyboard: full Tab/Enter/Esc support on every interactive element;
  no keyboard traps
- Focus visible: never `outline: none` without a visible replacement
- Contrast: ≥ 4.5:1 for body text, ≥ 3:1 for UI controls
- Skip-to-content link at top of every page (already in
  `apps/web/app/(public)/layout.tsx`)
- ARIA roles where native HTML is insufficient (modals, tabs, dropdowns,
  combobox)
- Croatian-language attribute on `<html lang="hr">`

## Testing

- **CI**: axe-core integration test (Sprint 7) — fail = no deploy
- **Manual**: NVDA (Windows) and VoiceOver (macOS) on critical flows:
  lead form, dealer dashboard, admin lead processing, magic link tracker
- **Mobile**: TalkBack (Android) and VoiceOver (iOS) on lead form

## Patterns

> TODO: document custom component accessibility patterns as they're built
> (Sprint 2+).

## Testing log

> TODO: append screen-reader test results here as they're run (Sprint 7+).

## Resources

- [WCAG 2.1 quick reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## TODO

- [ ] axe-core CI integration (Sprint 7)
- [ ] Manual screen reader test on full lead flow before launch
- [ ] Document keyboard shortcuts, if any are added
