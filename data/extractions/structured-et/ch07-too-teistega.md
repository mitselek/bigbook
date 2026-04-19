# ch07-too-teistega — extraction report

## Summary

`Töö teistega` (Working With Others), PDF pages 121–135, book pages 89–103.
Emitted **49 blocks**: 1 heading + 48 paragraphs. Zero verse, zero list-items,
zero footnotes, zero bylines, zero tables, zero blockquotes. A straightforward
advice-chapter; the only notable wrinkle is a source artifact in the heading
(see Flagged blocks). Extraction script lives at `.tmp/extract-ch07-et.py`.

## Method

Used `pymupdf.open(...).get_text("dict")` per section conventions. Single-pass
pipeline (no `rawdict`, no `pdfplumber`):

1. **Line filtering** — drop ET running headers via `y0 < 45 AND (size <= 11.5 OR digit-only)`;
   drop chapter-opening page number at bottom (y > 520, size <= 11.5); drop italic
   `7. peatükk` label at top of page 121 via regex.
2. **Heading detection** — first line on page 121 at `size ∈ [13, 15]` whose
   text uppercased starts with `TÖÖ`. Matched `TÖÖ TEISTE` (see note).
3. **Drop-cap detection** — first line on page 121 with `BrushScriptStd` font
   at size > 20; matched `P` at (x=56.7, y=115.8, size=33.0).
4. **Drop-cap merge** — the first body wrap line is at (y≈120.3, x≈86.5)
   ('raktiline kogemus…'). Merged by concatenating `P` + `raktiline…` → `Praktiline…`.
   Second wrap line at (y≈134.8, x≈86.5) kept in same paragraph via a
   wrap-zone gate (`y <= 145 AND x >= 80`) that suppresses paragraph-start
   detection in that region.
5. **Paragraph boundary** — x-indent based: lines with `64.0 <= x0 <= 75.0` start a
   new paragraph; all other x-positions (including the main body margin x=56.7
   and cross-page continuations) append to the current paragraph.
6. **Join rules** — ET conventions applied: soft hyphen (U+00AD) at line-end
   strips and joins no-space; `-` (U+002D) at line-end followed by lowercase
   strips and joins no-space; en-dash / minus-sign preserve surrounding space
   when space-padded; default adds single space between joined lines.

No pdfplumber used. No table detection. No `rawdict` probe needed.

## Schema decisions

- **Heading preserved as source-rendered `TÖÖ TEISTE`** (not `TÖÖ TEISTEGA`).
  See Flagged blocks for the rationale. Section `title` metadata stays
  `Töö teistega` per the prompt; heading block diverges per the existing
  title-vs-heading convention.
- **Closing italic paragraph (p049)** "Lõppude lõpuks olid meie probleemid…"
  on page 135 (font `NewCaledoniaLTStd-It`, indent x=68) kept inline as a
  regular `paragraph` block. Italics alone is not a split signal per the
  EN parent conventions and ch02 precedent.
- **No footnotes, verses, lists, bylines, tables, blockquotes** — none of
  those block kinds appear in this chapter.

## Flagged blocks

### `ch07-too-teistega-h001` — heading reads `TÖÖ TEISTE`

The PDF renders the chapter title literally as `TÖÖ TEISTE` (10 chars, ends at
x1=236.1), missing the final `GA`. Confirmed via both `get_text("dict")` and
`get_text("rawdict")` (all 10 glyphs extracted; no hidden 11th span) and via
`pdftotext -layout -f 121 -l 121` which also shows `TÖÖ TEISTE`. The running
header on pages 123, 125, 127, 129, 131, 133, 135 correctly shows the full
`TÖÖ TEISTEGA` at size 10 — so the intended title IS "Töö teistega", but the
main chapter-title rendering in the source PDF is truncated.

Applied the ET fidelity-over-correction rule (see conventions doc §"Text quirks
to preserve verbatim"): **if the PDF renders a character, preserve it; if it
doesn't, don't synthesize it**. Heading emitted verbatim as `TÖÖ TEISTE`.
Section `title` metadata remains `Töö teistega` per the standing title-vs-heading
divergence convention.

Quoted snippet (heading block):

```json
{
  "id": "ch07-too-teistega-h001",
  "kind": "heading",
  "text": "TÖÖ TEISTE",
  "pdfPage": 121
}
```

## Schema proposals

None. All ET conventions applied cleanly; no new rules surfaced.

## Counts

- blocks: 49
- by kind: heading=1, paragraph=48
- pages covered: 121–135 (15 pages)
- drop-caps merged: 1 (`P` → `Praktiline`)
- chapter-label drops: 1 (`7. peatükk` on p121)
- running-header drops: 28 (14 even-page ALL-CAPS titles + 14 running page numbers — verified via line count)
- bottom-of-page book page number drops: 1 (`89` on p121)
- source artifacts preserved: 1 (`TÖÖ TEISTE` truncation in heading)
