# ch08-naistele — extraction report

## Summary

Estonian structural extraction of chapter 8, **"Naistele"** (To Wives). PDF pages
136–153 (book pages 104–121). Emitted **66 blocks**: 1 heading, 63 paragraphs,
2 footnotes. Block-count parity with the EN counterpart is **exact** (EN
`ch08-to-wives` also has 66 blocks with the same kind distribution 1/63/2).

No verse, list-item, blockquote, table, or byline blocks — the chapter is pure
prose. No structural surprises.

## Method

PyMuPDF only. `page.get_text("dict")` per page, flatten to a line-stream sorted
by (pdf_page, y0, x0).

Running-header drop gate: `y0 < 45 AND (size <= 11.5 OR digit)` (ET Wave 3
gate). Odd-page headers are `NAISTELE` + page-number at y=35, 11pt NewCaledonia;
even-page headers are `ANONÜÜMSED ALKOHOOLIKUD` + page-number at y=35.

Bottom-of-page page-number drop (page 136 has `104` at y=530.8, size=11) was
gated by `digit AND size <= 11.5 AND y0 > 520`.

Chapter label drop: `^\d+\.\s*peatükk\s*$` on page 136, italic 12.5pt.

Paragraph-start detector: `x0 in [64, 80]`. Body margin on all pages is 56.7;
first-line indent is 68.0 (exact). Cross-page continuations (first line of a
new page at x=56.7) are appended to the open block instead of flushing it — no
explicit cross-page merge pass was needed because continuation lines are simply
non-indented.

Paragraph-line join uses the ET rule set from
`2026-04-18-structured-extraction-et-conventions.md`:

- Trailing U+00AD (soft hyphen) → strip + join no-space.
- Trailing U+002D + lowercase continuation → strip + join no-space (defensive;
  ET seed allowlist is empty, and the ET source encodes all cross-line splits
  via soft hyphen anyway).
- Trailing en-dash (U+2013) / minus (U+2212): preserve + join with leading
  space if the pre-stripped line had a trailing space (space-padded Estonian
  mid-sentence dash convention).
- Trailing em-dash (U+2014) or leading em-dash on next line: join without space.

## Schema decisions

- **Heading text includes the footnote marker**: `NAISTELE*` (not `NAISTELE`).
  The `*` is visually part of the heading line in the PDF (same size, same
  font, same y-coordinate), and it cross-references the chapter's first
  footnote. Preserving the marker matches the conventions rule "footnote
  marker preserved as first char of footnote text" and its cross-reference
  contract — the `*` at the end of the heading flags the reader that there is
  a footnote, and the `*` at the start of `f007` is the anchor.
- **Drop-cap merge**: BrushScriptStd `M` at 33pt on page 136 merged with body
  first line `eie raamat…` (at x=100.1 due to drop-cap wrap) to yield
  `Meie raamat on siiani…`. No space, no small-caps tail (ET drop-caps don't
  have one per ET conventions).
- **Drop-cap wrap zone**: body lines at y ≤ 130 on page 136 that sit at
  x ≥ 90 are treated as wrap-indent continuations of the drop-cap first line,
  not as new paragraphs. (Lines 2–3 at y=118.9 and y=133.4 actually sit at
  x=100.1 and x=56.7 respectively; line 2 is the wrap-indent, line 3 returns
  to body margin and is part of the same drop-cap paragraph.)
- **Footnote placement**: each footnote sits on its source page's bottom, at
  y > 350 with size ≤ 10.5. Inserted after the last paragraph on its source
  page in the final block order.
- **Inline `*` marker in body**: the last prose line on page 153 ends with
  `…tarbetuid kannatusi.*` — the `*` is preserved verbatim in `p064`'s text
  and cross-references `f066`. Same treatment as for `p001`'s `NAISTELE*`
  heading / `f007` footnote pair. Two footnotes, two in-body markers, both
  preserved.

## Flagged blocks

None. All blocks inspected; no ambiguous splits, no residual soft hyphens,
no NUL bytes, no double-space artifacts, no orphan `hyphen space word`
patterns.

## Known cross-language parity

- **66/66 blocks** match EN `ch08-to-wives` exactly (1 heading, 63 paragraphs,
  2 footnotes).
- Both footnotes in ET are present at the same structural positions as the
  EN counterpart.
- Heading text `NAISTELE*` preserves the star marker identically to EN
  (`TO WIVES*`).

## Schema proposals

None — the ET and EN conventions cover this section cleanly. Drop-cap, running
header, dash, and footnote rules fired as documented.
