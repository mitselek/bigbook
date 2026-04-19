# appendix-vi-kuidas-aaga-uhendust-votta (ET) extraction report

## Summary

Single-page ET appendix (PDF p605, book p573). Six blocks emitted: one `heading` + five `paragraph` blocks. No verse, list, table, footnote, byline, or blockquote content on this page. Cross-line text uses the expected ET soft-hyphen mechanism (U+00AD); no unusual cross-paragraph layout.

## Method

- **Library**: PyMuPDF `page.get_text("dict")` only.
- **Probe script**: `.tmp/probe-appendix-vi-et.py` dumped all lines with font/size/bbox.
- **Extraction script**: `.tmp/extract-appendix-vi-et.py`.
- **Heuristics that fired**:
  - Two-line centered heading merge (`VI` at y=48.66 size 14.0 + `KUIDAS AA-GA ÜHENDUST VÕTTA` at y=63.66 size 14.0) → single `heading` block `VI KUIDAS AA-GA ÜHENDUST VÕTTA`.
  - Paragraph boundary on first-line indent (`x0 >= 64`). Body margin is x=56.69; paragraph-start indent is x=68.03. Five paragraphs detected cleanly.
  - ET soft-hyphen cross-line join (Wave 1 rule): soft-hyphen preserved through extraction, stripped-and-joined at line-join time. Confirmed joins: `preestri- telt` → `preestritelt`, `korral- davad` → `korraldavad`, `nõndanime- tatud` → `nõndanimetatud`, `rahvus- vaheline` → `rahvusvaheline`, `usaldu- sisikud` → `usaldusisikud`, `kodulehe- külge` → `kodulehekülge`, `kesku- sest` → `keskusest`, `kirju- taksid` → `kirjutaksid`, `toi- mumispaiga` → `toimumispaiga`.
  - Page-number drop: bottom-page `573` at y=530.79 dropped via the standalone-digit guard.
- **Heuristics that did NOT fire**: no en-dash/minus dashes at line boundaries, no em-dashes, no drop-cap, no verse, no footnote, no byline on this page.

## Schema decisions

- **Heading**: merged two-line roman-numeral + title pattern per the parent conventions (Wave 3 rule used for all ET appendices). Output: `"VI KUIDAS AA-GA ÜHENDUST VÕTTA"`.
- **`AA-GA` hyphen**: preserved verbatim from the PDF rendering. The metadata `title` (`"VI Kuidas AAga ühendust võtta"`) intentionally diverges from the heading block text (`"VI KUIDAS AA-GA ÜHENDUST VÕTTA"`) — this is the standard metadata-vs-visual-rendering divergence documented in the parent conventions doc.
- **Paragraph count**: 5, matches visual paragraph count on the page (each begins with a first-line indent at x=68.03).
- **No byline**: unlike `appendix-ii`, this page has no author attribution; the text ends on a period after `probleemist.`.

## Flagged blocks

None. All blocks are unambiguous. All cross-line soft-hyphen joins produce valid Estonian tokens.

## Schema proposals

None. Rules from the parent ET conventions (soft-hyphen strip-and-join, two-line heading merge, ET running-header drop) handled this page cleanly.

## Block counts

- Total: 6
- By kind: `heading` 1, `paragraph` 5

## Heading text

`VI KUIDAS AA-GA ÜHENDUST VÕTTA`
