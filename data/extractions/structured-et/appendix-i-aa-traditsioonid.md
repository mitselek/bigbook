# appendix-i-aa-traditsioonid — extraction report

## Summary

Extracted the Estonian Appendix I (`I AA Traditsioonid` — the A.A. Tradition) from PDF
pages 593..598. Emitted 33 blocks: 3 headings, 1 table, 5 paragraphs, 24 list-items
(12 short-form + 12 long-form traditions). No verse, no footnotes, no byline — the
section is strictly prose + two numbered lists, matching the English appendix-I
exemplar structurally.

## Method

- PyMuPDF `get_text("dict")` per page, spans → line records with font/size/bbox.
- Ligature expansion + NUL stripping up front; soft-hyphens retained until join-time.
- Running-page-number drop: digit-only lines with `size <= 11.5` in header OR footer
  zone (y<50 OR y>520) — page 593 has its page-number at the BOTTOM at y=530, unlike
  subsequent pages which have it at the TOP at y≈35.
- Running header `AA 12 TRADITSIOONI` (size 11, y<55): drop on pages 594, 596, 597,
  598 — but NOT on page 595, where the same text IS the long-form section heading
  (detected by the presence of `(Pikk versioon)` on the second line).
- Regional classification after heading extraction:
  - p593 body (sz=12.5 NewCaledonia): intro-prose (paragraph-start by x0 >= 64).
  - p594 (italic sz=11): short-form list (item start by word-prefix regex).
  - p595 y<100 italic: long-form intro paragraph.
  - p595..p598 body (sz=11): long-form list (item start by `^\d{1,2}\.\s*[−…]`).
- Line-join using ET rules: soft-hyphen → strip+no-space; en-dash/minus at line-end
  with trailing space → join-with-space; default → single-space join.

## Schema decisions

- **Included the appendices TOC on p593** as a `heading` (`LISAD`) followed by a
  `table` block with 7 `{numeral, title}` rows. The TOC is authored content
  physically located on page 593 (within our page-range) and it previews the whole
  Appendices section (I..VII). I treated it as belonging to appendix-i since that's
  the first appendix and the PDF attaches the TOC to its opening page. The
  English edition has no equivalent element (EN p566 only has an `APPENDICES`
  running-header-style label that the EN agent drops).
- **TOC emitted as `table`** rather than a list of paragraph pairs because it's a
  two-column tabular layout (left column at x≈85-107 for roman numerals, right
  column at x=119 for titles), with different line-spacings per column (numerals at
  12pt leading, titles at 14.5pt leading). Pair-by-order (sort each column by y,
  zip) was required — y-proximity pairing fails because the columns drift apart.
  Text serialization uses `" | "` between cells and `"\n"` between rows, per
  conventions.
- **Two-line appendix heading merge**: `I` (y≈164.88, sz=14) + `AA TRADITSIOON`
  (y≈179.88, sz=14) → single heading `I AA TRADITSIOON` joined by space.
  Note: the title is **singular** (`TRADITSIOON`) in the heading, but the metadata
  `title` is **plural** (`AA Traditsioonid`) and the sub-heading on p595 is also
  plural (`AA 12 TRADITSIOONI`). The heading block preserves the source's visual
  rendering per the "title metadata vs heading visual" convention.
- **Long-form heading** is a two-line merge: `AA 12 TRADITSIOONI` + `(Pikk versioon)`
  → `AA 12 TRADITSIOONI (Pikk versioon)`. This is analogous to the EN
  `The Twelve Traditions (The Long Form)`.
- **Short-form list-item prefix**: ET uses **word form** followed by U+2212
  MINUS SIGN with spaces, e.g. `Üks − Meie ühine hüvang ...`, `Kaks − Meie
  rühma ...`, ..., `Kaksteist − Anonüümsus ...`. Same structure as EN
  (`One—`, `Two—` etc.) but with: Estonian cardinals (Üks/Kaks/Kolm/Neli/Viis/
  Kuus/Seitse/Kaheksa/Üheksa/Kümme/Üksteist/Kaksteist) AND U+2212 minus-sign +
  surrounding spaces instead of U+2014 em-dash tight-joined.
- **Long-form list-item prefix**: `N. − ...` using Arabic numeral + period + space
  + U+2212 minus-sign + space. All 12 items match. This is different from EN
  (`1.—`, `2.—` tight em-dash) — the ET form is space-padded with minus.
- **Interior dashes in list items**: Most mid-sentence dashes are **U+2212 minus
  sign** space-padded, matching ET convention. Long-form items 2 and 5 have an
  interior **U+2013 en-dash** (`armastav Jumal –`, `üks peamine eesmärk –`) which
  is also preserved. Both are consistent with the ET conventions (en-dash or minus
  sign, space-padded).
- **No verse, no footnote, no byline** — this appendix has none of those elements.

## Heading verdict

Two-line centered heading on p593 merged correctly: `I AA TRADITSIOON`. The `I`
glyph has no interior letter-spacing artifacts (unlike `V I I ` in appendix-vii),
so no whitespace-collapse needed for the numeral.

## Short-form Twelve Traditions verdict

**12 complete list-items** emitted (block ids `l008` through `l019`, all on p594).
All start with the correct Estonian cardinal prefix + space + U+2212 + space.
Text of each item fully joins across its 1-3 visual lines using soft-hyphen strip.

## Long-form Twelve Traditions verdict

**12 complete list-items** emitted (block ids `l022` through `l033`, spanning
pages 595..598). Each item starts with `<n>. − ...`. Multi-page items (1-6 start
on p595; 7-8 on p596; 9-11 on p597; 12 on p598) correctly span pages because the
long-form region-walk is page-agnostic until a new numeric prefix is seen.

## List-item prefix style

- Short form: **word cardinal + U+2212 minus** (`Üks −`, `Kaks −`, ...,
  `Kaksteist −`). NOT Arabic numerals; NOT em-dash.
- Long form: **Arabic numeral + period + U+2212 minus** (`1. −`, `2. −`, ...,
  `12. −`). NOT word-form; NOT em-dash.

Both inline dashes between prefix and body text are U+2212 MINUS SIGN (not the
U+2014 EM-DASH used in the EN exemplar, nor the U+2013 EN-DASH used for some
mid-sentence dashes inside body text).

## Flagged blocks / source quirks

Per ET convention "preserve text verbatim — fidelity to source beats grammatical
correctness", the following source-level oddities are kept as-is:

- **`l025` (long-form item 4)** contains `mõjutavad ka teiste rühmade heaolu,
  heaolu, siis tuleks`. The word `heaolu,` is duplicated across visual lines
  y=330.66 and y=344.66 in the source. PyMuPDF extracts both. This is a
  typesetter error in the printed Estonian PDF; preserved verbatim.
- **`l026` (long-form item 5)** ends with `...veel kannatava alkohoolikuni.
  simustes on meie ühine heaolu esmatähtis.`. The trailing fragment
  `simustes on meie ühine heaolu esmatähtis.` is a stray line at y=456.66 on p595
  — it's a duplicated-and-truncated continuation of item 4 (`küsimustes` →
  `simustes` with leading chars clipped) that the typesetter missed on cleanup.
  Preserved verbatim.
- **`h003`**: `I AA TRADITSIOON` — singular noun despite the section's metadata
  title being plural `AA Traditsioonid`. The p595 heading is also plural
  `AA 12 TRADITSIOONI`. Only the main appendix heading on p593 uses the
  singular form; preserved as rendered.

No blocks that required editor judgment beyond these documented verbatim
preservations.

## Schema proposals

None. All existing conventions applied cleanly. One small observation for the
evolution log:

- **ET TOC-on-appendix-opening pattern** — the Estonian edition attaches an
  appendices-level TOC (title `LISAD` + 7 roman-numeral/title pairs) to the
  opening page of appendix-I. It's not a running header and should not be
  dropped. Emitting as `heading` + `table` worked; this is the first ET section
  to encounter this layout. If later ET appendices have their own opening-page
  TOCs, the same pattern applies.
- **Two-column TOC y-pair-by-order** (not y-proximity): different per-column line
  leading means a naive dy-matching fails. Sort each column by y and zip. This
  is a minor heuristic worth noting but does not require a conventions change.
