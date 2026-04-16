# P6 — Mobile Responsive

**Phase goal:** Add the <900px responsive breakpoint: stacked paragraph pairs with EN/ET labels, inline marginalia, burger menu in the top bar.

**Execution mode:** Inline (Plantin). This is CSS + minor markup changes — no new modules, no TDD cycle.

**Files:**

- Modify: `src/components/ParagraphRow.svelte` (stacked layout at <900px, EN/ET labels)
- Modify: `src/components/Marginalia.svelte` (inline block at <900px)
- Modify: `src/components/TopBar.astro` (burger menu at <900px)
- Modify: `src/components/TopBarClient.svelte` (truncated title at <900px)

---

## Task P6.1 — ParagraphRow + Marginalia mobile styles

- [ ] Add CSS media query `@media (max-width: 899px)` to `ParagraphRow.svelte`:

1. Switch from `display: flex` (three columns) to stacked block layout.
2. EN paragraph on top, ET below — each full width.
3. Add small "EN" / "ET" labels above each paragraph:

```svelte
<div class="lang-label">EN</div>
<div class="para-en">{enText}</div>
<div class="lang-label">ET</div>
<div class="para-et">{etText}</div>
```

Label styles: `font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #aaa; font-family: system-ui, sans-serif; margin-bottom: 4px;`

4. Hide the wide-viewport marginalia column.

- [ ] Add CSS to `Marginalia.svelte` for `@media (max-width: 899px)`: render as an inline tinted block below the stacked pair (background `#faf5ee`, left border `3px solid #d4a574`, margin `0 12px 8px`, border-radius `2px`).

- [ ] Verify: resize browser to <900px. Paragraphs stack, labels appear, marginalia renders inline.
- [ ] **Commit:** `feat(mobile): P6.1 — stacked paragraph pairs with EN/ET labels`

---

## Task P6.2 — TopBar burger menu

- [ ] Add `@media (max-width: 899px)` to `TopBar.astro`:

1. Hide prev/next arrows and auth affordance on small screens.
2. Show a burger menu button (☰) in the right zone.
3. Clicking the burger toggles a dropdown menu containing: prev/next chapter links, "Sign in with GitHub" (or avatar if signed in).
4. The burger dropdown is a simple absolute-positioned panel below the top bar, dismissed on click outside or second click.

- [ ] Modify `TopBarClient.svelte`: at <900px, truncate the bilingual title with `text-overflow: ellipsis` and reduce font size.

- [ ] Verify: resize to <900px. Burger appears, prev/next and auth are in the dropdown. Title truncates properly.
- [ ] **Commit:** `feat(mobile): P6.2 — burger menu for narrow viewports`

---

## Task P6.3 — Mobile skeleton rows

- [ ] Verify that the skeleton rows (from ChapterSection's skeleton state) also respond to the <900px breakpoint — they should stack the same as loaded paragraph rows. If ChapterSection generates its own skeleton markup, add the matching media query styles.

- [ ] Run component tests from P3/P4 to confirm no regressions: `npm run test`.
- [ ] **Commit:** `feat(mobile): P6.3 — skeleton rows responsive`

---

## Phase-exit gate

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

(_BB:Plantin_)
