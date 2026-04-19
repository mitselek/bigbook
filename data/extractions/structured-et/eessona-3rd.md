# eessona-3rd — structural extraction report

## Summary

ET Foreword to the 3rd Edition (`Eessõna kolmandale väljaandele`). Single-page
foreword at pdf page 22. Emitted **5 blocks**: 1 heading + 4 paragraphs. No
footnotes, verse, tables, list-items, or bylines. Clean extraction — no
flagged blocks.

## Method

- PyMuPDF `page.get_text("dict")` only; no `pdfplumber`.
- Working files: `.tmp/probe-eessona-3rd.py`, `.tmp/extract-eessona-3rd.py`.

Heuristics fired:

- **ET soft-hyphen join** (U+00AD): 5 line-end soft hyphens joined without
  space — `küsitle\xad` + `tud` → `küsitletud`, `toimi\xad` + `vat` →
  `toimivat`, `rahvu\xad` + `sest` → `rahvusest`, `Kaks\xad` + `teist` →
  `Kaksteist`, `terve\xad` + `nemisele` → `tervenemisele`. No U+002D
  line-ends, no compound-allowlist path needed.
- **Drop-cap merge** (ET variant): BrushScriptStd 33pt `M` at x=57.1 y=72.0,
  body continues at NewCaledoniaLTStd 12.5pt with no small-caps tail — join
  `M` + `ärtsiks` → `Märtsiks` (no space, standard ET drop-cap behavior).
- **Drop-cap wrap-zone** (two wrap lines at x=100.5 within drop-cap y-band
  y=72..91): treated as continuation of the drop-cap paragraph, not new
  paragraph starts.
- **Running-header / page-number drops**:
  - Top: no top running header on this page (the heading `EESSÕNA KOLMANDALE
    VÄLJAANDELE` sits at y=48.8 size 14.0 — passes the `y0 < 45 AND
    size<=11.5 OR digit` gate).
  - Bottom: page number `xxii` at y=530.8 size 11.0 dropped via
    `y0>520 AND size<=11.5 AND roman-numeral`.
- **Paragraph-indent detection**: body margin x=56.7, paragraph-indent
  x=68.0 — straightforward, all 3 non-drop-cap paragraphs start at x=68.0.
- **Estonian curly quotes** (`„` U+201E and `”` U+201D) preserved verbatim
  in paragraph p004 (`„los Doce Pasos"`, `„les Douze Etapes"`).

## Schema decisions

- **Heading text**: preserved source ALL-CAPS rendering (`EESSÕNA KOLMANDALE
  VÄLJAANDELE`), diverging intentionally from the prose-case metadata
  `title` (`Eessõna kolmandale väljaandele`). Matches the Wave 1B convention
  about title/heading divergence.
- **Drop-cap**: emitted as part of the first paragraph's text (no separate
  block). No small-caps tail in ET — join-no-space with the wrap-indent line.
- **No heading size quirk**: heading is 14.0pt (similar to EN Preface 14.0),
  distinct from body's 12.5pt and running-header/page-number 11.0pt.
- **No cross-page merge needed**: single-page foreword.

## Flagged blocks

None — all 5 blocks emitted cleanly with no ambiguity.

## Schema proposals

None. All conventions fit this section as-is. Single-page ET foreword
behaved identically in structure to other single-page ET front-matter
sections (e.g. the preface's per-page structure).

## Counts

| Kind      | Count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 4     |
| **total** | **5** |
