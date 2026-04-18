# foreword-3rd-edition — extraction report

## Summary

Single-page front-matter foreword (page 11). Emitted **5 blocks total**: 1 `heading` + 4 `paragraph`. No verse, list-item, footnote, byline, blockquote, or table. Extraction is clean — no flagged uncertainties.

## Method

- **Library:** PyMuPDF (`pymupdf`) `page.get_text("dict")` for line+span coordinates and font data. No `pdfplumber` fallback needed.
- **Script:** `.tmp/extract-foreword-3rd.py` (adapted from the Wave 4 foreword-2nd-edition template).
- **Line filters applied:**
  - Running-header drop rule: skip lines with `y0 < 50` AND (`size <= 9.5` OR digit-only). Front-matter pages in this book have no running headers, so this was defensive — nothing dropped.
  - Footer page-number drop rule: skip lines with `y0 > 500` AND digit-only. Nothing matched — page 11 has no visible page number.
- **Heading detection:** first line on page 11 with `size >= 12.5` containing `"FOREWORD"`. Matched `FOREWORD TO THIRD EDITION` at 13.02pt.
- **Paragraph segmentation:** intra-page y-gap threshold. Body lines step `~13.3pt`; paragraph breaks step `~27pt`. **Edge case:** paragraph 1's first line carries the ParkAvenue 19.98pt drop-cap `B`, making its bounding box taller and the y0 delta to its second line ~20.4pt (rather than ~13.3pt). A naive 18pt threshold would split the drop-cap onto its own paragraph. Chose threshold `23.0pt` — comfortably above 20.4 and below the 27pt paragraph gap.

## Schema decisions

- **Drop-cap merge — small lead-in cap, front-matter variant.** The opening visual is `B` in ParkAvenue 19.98pt followed (same PyMuPDF logical line) by `Y March 1976, when this edition went to the printer, the ` in NewCaledonia 10.98pt. PyMuPDF already pre-joins the drop-cap glyph and the body-text span into one `text` string, so the merge is a no-op at the string level. Final block text starts `"BY March 1976..."` — the `B` + `Y` are joined as the word `BY` (visual rendering of the small-caps lead-in), with no space inserted. This matches the front-matter drop-cap convention (Preface's `T`+`HIS IS`, Doctor's Opinion's `WE OF`).
- **Italic inline phrases kept inline.** Paragraph 3 contains `los Doce Pasos` and `les Douze Etapes` in NewCaledonia-Italic 10.98pt. Per conventions ("italicized pull-quotes kept inline with the surrounding paragraph"), these are not split into separate blocks.
- **Em-dash join (no space).** Paragraph 2 contains `age—among them` at a line break (`age—` on one line, `among` starting the next). The em-dash rule (do not insert space when joining across a line ending in `—`) applies. Verified in output: `"...years of age—among them..."`.
- **No deck/subtitle.** Unlike `foreword-2nd-edition` (which has an italic "Figures given in this foreword..." note), page 11 has no such note below the heading — only a blank filler line which my line filter dropped (whitespace-only text).

## Flagged blocks

None. All 5 blocks parse cleanly; no ambiguity in paragraph boundaries, no cross-page merge needed (single-page section), no compound-word hyphenation splits fired on this page (the `one-fourth` / `one-third` hyphens occur mid-line and were preserved by normal line-join).

## Schema proposals

None. Conventions covered every decision in this section.

## Counts

| Kind      | Count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 4     |
| **total** | **5** |

- Heading text: `FOREWORD TO THIRD EDITION`
- Drop-cap verdict: front-matter small-lead-in variant (`B` + `Y March 1976...`), merged as `BY March 1976...`, no space inserted, PyMuPDF pre-joined in a single logical line.
