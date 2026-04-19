# story-voitja-votab-koik

## Summary

Estonian extraction of "Võitja võtab kõik" (English: "Winner Takes All"),
Part II.B story #12 ("They Stopped In Time"). PDF pages 407–413, book pages
375–381. Emitted **24 blocks**: 1 heading + 1 italic deck paragraph + 22 body
paragraphs. No list-items, verses, footnotes, tables, or byline.

High-level issues: none. Cross-page paragraph merges proceeded cleanly on
six of six page boundaries (407→408, 408→409, 409→410, 410→411, 412→413
continue; 411→412 is a genuine paragraph break with period+indent). The
drop-cap on p407 (BrushScriptStd 'M') and its wrap-zone were handled by the
standard ET wide-glyph rule (+35 x-offset vs body margin 56.69 → wrap at
x≈98). Source quirks preserved verbatim (see Flagged blocks).

## Method

- PyMuPDF `page.get_text("dict")` on pages 407–413.
- Lines sorted by `(pdf_page, y0, x0)`.
- Running-header drop: `y0 < 45 AND (size <= 11.5 OR text.isdigit())`. ET
  running headers at 11pt (`ANONÜÜMSED ALKOHOOLIKUD` on even pages,
  `VÕITJA VÕTAB KÕIK` on odd pages) and page numbers 376..381 dropped cleanly.
- Bottom-of-page footer on p407 (`375` at y≈530.79, 11pt) dropped via
  `digits AND size<=11.5 AND y>520`.
- Story-number `(12)` at y≈48.83 size=13 on p407 dropped via the
  `^\(\d+\)\s*$` regex guard.
- Heading detected by `size ∈ [13.5, 15.0] AND 'VÕITJA' in text` on the
  first page. Single line at y=67.92.
- Italic deck detected by `font contains '-It' AND y ∈ [85, 135]` on p407.
  Three wrapped lines joined as one paragraph (single first-line indent
  at x=68.03 with continuations at x=56.69 — so exactly one deck
  paragraph per the Wave 3 rule).
- Drop-cap: `BrushScriptStd size >= 20` on p407 → `M` at (54.69, 140.72).
  First body line at (98.08, 145.18) merged as `'M' + 'inu vanemad...'`
  → `'Minu vanemad...'`.
- Drop-cap wrap-zone (+35 offset, wide glyph): p407, y ∈ [145, 170],
  x ∈ [92, 105] are continuations of the first paragraph.
- Body paragraph detection: first-line indent at x ≈ 68.03
  (window 64.0 ≤ x < 80.0); body continuation at x ≈ 56.69.
- Cross-page merge: handled implicitly by the paragraph-start indent
  check on each page's first body line. Page-top continuations land at
  x=56.69 (no indent) and are absorbed into the previous paragraph;
  page-top new paragraphs at x=68.03 flush prior and open a new one.
- Join rules: U+00AD soft-hyphen strip-and-join (the ET mechanism);
  line-end U+2013/U+2212 with surrounding-space detection; U+002D
  line-end preserved (ET rule — none actually at line-end in this section).

## Schema decisions

- **Story-number `(12)` dropped** (not emitted) per conventions: it is
  decorative numbering, not authored content.
- **Italic deck = single paragraph**. The deck wraps three lines on p407
  with exactly one first-line indent at x=68.03 — the default single-
  paragraph rule applies (Wave 3 softening would split on multiple
  indented groups, but there is only one group here).
- **Drop-cap merge no-space**: `M` + `inu vanemad...` → `Minu vanemad...`
  (single letter + word continuation, no space inserted). No small-caps
  tail in Estonian edition per convention, so no pronoun-`I` or proper-
  noun re-capitalization post-flatten needed.
- **No byline** — the story ends with the final paragraph "...õigele
  rajale juhatavad." with no author attribution (anonymous story).
- **Source quirks preserved verbatim** (see Flagged blocks).

## Flagged blocks

- `story-voitja-votab-koik-p005`: PDF has no space after period in
  `soovimatuna.Nagu` (p407 y=420.68: `tuna.Nagu lapsed...`). Preserved
  verbatim per ET fidelity-over-correction convention. Similar quirks
  noted in Wave 1/2/3 (e.g., `o1i`, `sõruskonna`, `Dave B`).
- `story-voitja-votab-koik-p007`: contains space-padded U+2212 minus
  sign `endiselt − aga noh`. Joined without splitting — minus sign is
  mid-line, not at a line break. Correct.
- `story-voitja-votab-koik-p009`: intra-line compound `t-särgil`
  (T-shirt) preserved. Real U+002D hyphen in mid-line context.
- `story-voitja-votab-koik-p017`: contains `6.30-ks` (time with
  genitive suffix via U+002D hyphen, intra-line). Preserved verbatim.
- `story-voitja-votab-koik-p020`: number `3,71` (Estonian decimal comma)
  preserved. Also compound `kolledžisse` (no hyphen needed).

## Schema proposals

None. Existing conventions handled this story cleanly. Block-count
parity with the English counterpart story-winner-takes-all would be
useful to verify if that extraction is available in Wave 5 EN pipeline;
structural alignment looks sound (single heading, single deck
paragraph, ~22 body paragraphs, no byline/list/table/verse/footnote).
