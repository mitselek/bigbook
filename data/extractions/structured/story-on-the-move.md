# story-on-the-move — extraction report

## Summary

Part III (They Lost Nearly All) story, PDF pages 492–499 (8 pages). The extraction produced **24 blocks**: 1 `heading` + 23 `paragraph`. No list-items, verse, footnote, table, blockquote, or byline. The story has a standard structure: story-number drop, 2-line centered italic subtitle, narrow-glyph `I` drop-cap, and a clean prose body that ends without a sign-off on page 499.

## Method

- Single-pass extraction via `pymupdf` (`page.get_text("dict")`), sorted by `(pdf_page, y0, x0)`.
- First-page structural elements identified by font/size signatures before main paragraph assembly:
  - heading: `ON THE MOVE` at `size=13.5`, text-match on "ON THE MOVE".
  - subtitle: `NewCaledonia-Italic`, `size=11`, `y0 < 170`.
  - drop-cap: `ParkAvenue`, `size>40`.
  - first body line after drop-cap: within y-band and `x0 > body_margin + 20` (narrow-glyph rule for `I`).
- Body prose: paragraph-boundary = first-line indent `x0 >= body_margin + 8`.
- Body margin toggles by page parity: this story starts on PDF **page 492 (even)** which uses body margin 69.28; odd pages 493/495/497/499 use 52.28. (Flipped from stories that start on odd book-pages.)
- Running-header drop: `y0 < 50 AND (size <= 9.5 OR text.isdigit())`; bottom-of-page page-number drop for `y0 > 500 AND text.isdigit()` (catches the `486` at y=540 on page 492 size 9pt).
- Story-number `(7)` at y=79 size=12.5 dropped by explicit regex match on the first page.

## Heuristics fired

- **Narrow-glyph drop-cap wrap-zone** — offset relaxed to +20 (from the default +35 for W/M/P) for the `I` drop-cap on page 492. Paragraph p003's first body line "thought my life had come to an end when I" sits at x=94.53, which is `body_margin(492)=69.28 + 25 > 69.28 + 20` → correctly detected as the drop-cap body line.
- **Drop-cap-is-pronoun space-join** — drop-cap "I" (standalone single-letter word, pronoun) + first body text "thought..." merged with a space: `I thought my life had come to an end...`.
- **Small-caps pronoun `\bi\b → I`** — applied to the merged first line. The SC-font tail has "I" lowercased; the line "thought my life had come to an end when I" becomes "thought my life had come to an end when I" (the trailing `I` survives the regex because it's already uppercase in this specific PyMuPDF output, but the pass is applied defensively per Wave 6 rule).
- **Drop story-number** — `(7)` matched and dropped.
- **Drop bottom-of-page page-number** — `486` on page 492 (y=540, size=9).
- **Drop running headers + running page-numbers** — all y<50 lines dropped on pages 493–499.
- **Cross-line hyphen normalization** — many standard `think-/ing`, `ef-/fects`, `diag-/nosed`, `exam-ina-/tions` style breaks. All tokens dropped the cross-line hyphen cleanly (none hit the compound allowlist). The one cross-page hyphen split (page 498 `help-` + page 499 `ing` → `helping`) resolved correctly.
- **Intact in-line compounds** — `twenty-five`, `twenty-eight`, `twenty-one`, `thirteen-year-old`, `six-pack`, `two-year`, `jumping-off`, `white-knuckling` all appear on single source lines; no cross-line fixup needed. Good — this story lands squarely inside the convention.

## Schema decisions

- **Story-number `(7)`** — DROPPED, per conventions. It's decorative structural numbering, not authored content.
- **Heading text** — "ON THE MOVE" (visual ALL-CAPS rendering preserved in the heading block), while section `title` metadata stays prose-case "On the Move" per conventions.
- **Subtitle** — 2 italic lines on page 492. First line at x=93.28 (indent), continuation at x=81.27. Single indent group → single `paragraph` block, per conventions default. The subtitle is visually center-aligned (longer line right-ends at ~328).
- **parentGroup** — `personal-stories/they-lost-nearly-all`. This is the first Part III story extracted in the structured path; the string matches the Part III group from the book's outline ("They Lost Nearly All — Alcoholic Bottom").
- **No byline** — the story ends with a plain body sentence "...I am grateful that a drunk like me was fortunate enough to live until I arrived in Alcoholics Anonymous." No signature, no `—N.` credit. No `byline` block emitted.
- **Body-margin parity** — this story starts on an **even PDF page (492)** where the body margin is 69.28. Odd pages (493/495/497/499) use 52.28. This flips relative to stories like `story-the-missing-link` which starts on PDF 292 (also even, but there 292's body margin is 52.28). The parity is driven by the physical page's gutter side, not a universal pdf_page % 2 rule — hence `body_margin()` is parameterized per-story in the extraction script. A future schema refinement could infer the margin empirically per-page from the observed left-edge distribution, but the hand-set parity is reliable for 8 pages.

## Flagged blocks

None — all 24 blocks read cleanly on review. No uncertain block boundaries, no suspicious content leaks, no ambiguous verse/blockquote candidates. The `"jumping-off point"` phrase appears twice (p008, p017) as dialogue punctuation inside regular paragraphs — not a verse or blockquote candidate.

## Schema proposals

None. This story lands squarely inside the conventions as of Wave 7. The narrow-glyph drop-cap rule (Wave 7), the standalone-pronoun drop-cap space-join (Wave 2), and the cross-line hyphen allowlist all applied correctly without need for per-section exceptions.
