# eessona-4th — Eessõna neljandale väljaandele

## Summary

Estonian Foreword to the 4th Edition. 2 PDF pages (23-24). Emitted **5 blocks**:
1 heading + 4 paragraphs. Straightforward front-matter foreword; no footnotes,
no list-items, no verse, no table, no byline. One cross-page paragraph merge
(p23 → p24) handled via front-matter terminal-punctuation heuristic.

Heading: `EESSÕNA NELJANDALE VÄLJAANDELE`.
Drop-cap: `K` (BrushScriptStd, 33pt) on p23, merged with wrap-zone body line
`äesolev …` → `Käesolev …` (no small-caps tail in ET).

## Method

PyMuPDF `page.get_text("dict")` on PDF pages 23-24. Single pass:

1. Extract per-line spans with bbox + font + size (per shared conventions).
2. Drop running headers and page numbers via the ET gate
   `y0 < 45 AND (size <= 11.5 OR isdigit OR roman-numeral)` and bottom
   page numbers via `y0 > 520 AND size <= 11.5 AND (digit OR roman)`.
3. Heading detected by `pdf_page == 23 AND size >= 13.0 AND text starts "EESS"`.
4. Drop-cap detected by `BrushScript` font AND size >= 20pt.
5. First body line in drop-cap wrap zone (y 70-90, x 85-100) identified and
   merged with drop-cap glyph + body-line text.
6. Paragraph starts detected by x-indent 64 <= x0 < 96 outside drop-cap wrap
   zone.
7. Cross-page paragraph merge: p23's final paragraph ends with non-terminal
   token `murdelised`, and p24's first line starts at body-margin `x=56.69`
   (no indent), so the front-matter terminal-punctuation heuristic merges them
   automatically — no special-case code needed.

## Schema decisions

- **Drop-cap merge:** joined `K` + `äesolev ...` → `Käesolev ...` (no space,
  no small-caps-tail flatten — ET body continues at normal size).
- **Cross-page paragraph**: p005 tagged with `pdfPage: 23` where it begins.
  The paragraph text contains content from both p23 and p24.
- **Running header on p24 (b2 in probe)** renders text `EESSÕNA TEISELE
  VÄLJAANDELE` + page number `xx`. This is a template glitch in the source
  PDF (actual section is `NELJANDALE`, not `TEISELE`), but the gate drops
  it regardless as running-header apparatus. No action needed.
- **No compound-allowlist hyphens** needed: all cross-line word splits used
  U+00AD soft hyphen (standard ET pattern). Line-end U+002D hyphen does
  not appear in this section.

## Flagged blocks

- **`eessona-4th-p002`** — the opening uses `”Anonüümsete Alkohoolikute”`
  with right-double-quote (U+201D) on BOTH sides, not the usual Estonian
  `„ … ”` pairing. The very next paragraph (`p003`) correctly uses
  `„Anonüümsed Alkohoolikud”`. This is a source typesetter inconsistency;
  preserved verbatim per ET "fidelity over correction" convention.

- **`eessona-4th-p005`** (the cross-page block) — joined across pages 23-24
  at `murdelised muudatused`. Reads naturally in context; no continuity issue.

## Schema proposals

None. Existing ET conventions cover every case cleanly.

## Counts

- Blocks: 5 total (1 heading, 4 paragraphs).
- PDF pages processed: 2 (23 → 24).
- Cross-page merges: 1 (p23/p4 → p24/p0).
- Soft-hyphen joins: multiple (all in-line body text wrapping).
- Drop-cap merges: 1 (`K` + `äesolev`).
