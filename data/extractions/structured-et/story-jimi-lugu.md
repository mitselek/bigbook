# story-jimi-lugu

## Summary

Pioneer story #6 (Estonian translation of "Jim's Story" / Jim S., first
Black A.A. member in Washington, DC). 32 blocks emitted across pages
264-277 (book pages 232-245): 1 heading, 31 paragraphs. No list-items,
no footnotes, no verse, no blockquote, no byline. Extraction was clean —
soft-hyphen ET mechanism fired 71 times, drop-cap merged cleanly
("S" + "ündisin" → "Sündisin"), paragraph boundaries well-separated by
first-line indent at x≈68.

## Method

PyMuPDF only. `get_text("dict")` per page, sorted by (pdf_page, y0, x0).

Heuristics fired:

- **Running-header drop (ET Wave 3 refined gate)**: `y0 < 45 AND (size <= 11.5
  OR text.strip().isdigit())`. Dropped `JIMI LUGU`/`ANONÜÜMSED ALKOHOOLIKUD`
  + pagenum pairs on pages 265-277 at y=35. Page 264 (opener) has no running
  header and was unaffected.
- **Bottom-page footer drop**: `text.isdigit() AND size <= 11.5 AND y0 > 520`.
  Caught `232` at y=530.8 on p264 (the opener's pagenum footer).
- **Story-number prefix drop**: `(6)` centered at y=199 size=13 on p264,
  above heading. Dropped by regex `\(\d+\)` with y<210 gate.
- **Heading detection**: p264, size ∈ [13, 15], text contains `JIMI LUGU`.
  Found at y=218.2 size=14.
- **Drop-cap detection**: BrushScriptStd, size ≥ 20pt. Found 'S' at y=305.6
  x=53.7 size=33.
- **Italic-deck capture**: NewCaledoniaLTStd-It, y ∈ [240, 290] on p264.
  3 lines gathered as one paragraph (the subtitle).
- **Drop-cap merge**: first body line on p264 at y=310 x=82.9 starting
  with 'ündisin' — merged with 'S' → 'Sündisin...'.
- **Drop-cap wrap-zone**: body lines on p264 at x≥78 y∈[305..345] treated
  as continuations of the first paragraph (not new paragraph-starts).
  Three wrap lines captured before body returns to x=56.7 at y=353.
- **Paragraph boundary**: `x0 >= 64.0` triggers a new paragraph. Body
  wrap margin is ~56.7; paragraph-start indent is x=68.0.
- **ET soft-hyphen join**: 71 U+00AD cross-line splits stripped and
  joined no-space (e.g. `tavali\xad ses` → `tavalises`, `viski\xadvaru` →
  `viskivaru`, `käega\xadkatsutavat` → `käegakatsutavat`).

## Schema decisions

- **Drop-cap merge**: standard ET pattern. 'S' is a mid-width glyph; wrap
  zone threshold chosen as x≥78 (body wrap starts at x=82.9 in practice,
  padded to 78 for tolerance). Three wrap lines captured on p264 before
  x returns to 56.7 at y=353.
- **Subtitle**: 3 italic lines on p264 (y=250/264.5/279) emitted as a
  single `paragraph` block per ET convention default. No indent changes
  within the deck that would suggest splitting.
- **Story-number prefix "(6)"**: dropped per conventions (structural
  numbering, not authored content).
- **Heading text preservation**: `JIMI LUGU` emitted verbatim (visual
  all-caps rendering), distinct from metadata `title: "Jimi lugu"`.
- **Inline italic on p269**: one italic line at y=280.9
  (`"tahtsin juua. Sealtmaalt algab tavalise joodiku lugu."`) is the
  tail of the preceding paragraph (p014). The preceding line at y=266.4
  is regular prose; the italic line continues mid-sentence without any
  layout signal for a new block. Per conventions ("italics alone is a
  weak split signal"), kept inline as part of p014. The effect is an
  italic emphasis on the closing clause of the paragraph.

## Flagged blocks

None — all 32 blocks are structurally clean. Spot-checks confirmed:

- `story-jimi-lugu-p003` (first body): drop-cap merge produces
  `"Sündisin ühes Virginia osariigi väikelinnas..."` — correct.
- `story-jimi-lugu-p011`: `"Lõpetasin Washingtonis alg- ja keskkooli..."`
  — intra-line hyphen preserved (not a line-break).
- `story-jimi-lugu-p014`: ends with italic-merged tail
  `"...Lisaks sellele, et mul oli vajadus alkoholi järele, ma tahtsin
  juua. Sealtmaalt algab tavalise joodiku lugu."` — inline italic
  correctly kept with prose.
- `story-jimi-lugu-p019`: `"Kuid Põhja-Carolinasse jõudes..."` —
  intra-line proper-noun hyphen preserved.
- `story-jimi-lugu-p032` (final): `"Selline on minu lugu sellest, mida
  AA on minu heaks teinud."` — correct terminal paragraph, no byline.

## Source quirks preserved verbatim

- `Vi` (wife's name, short for Vivian) appears repeatedly — not
  expanded. Preserve as-is.
- `Vi'ga` / `Vi'd` / `Vi'le` (Estonian grammatical cases with curly
  apostrophe `'`) — preserved.
- `Jim S` (no period) and `Ella G` / `Charlie G` / `Ella G-ga` /
  `Ella G.` (variable presence of period after surname initial) —
  preserved.
- `25-ndal` (Estonian ordinal suffix with hyphen) — preserved.
- `AA-sse`, `AA-st`, `AA` (inconsistent periods) — preserved.
- `Jumala` (Estonian God with capital) — unchanged by small-caps logic
  since drop-cap has no small-caps tail in this section.
- `Seattle'is` (curly apostrophe for foreign-word Estonian case) —
  preserved.
- Compound words like `käegakatsutavat` appear without hyphen after
  soft-hyphen strip-and-join. In source the break was a typesetting
  word-break, not an authored hyphen, so the ET strip-and-join default
  is correct. (English has `handy` / `tangible` here.)

## Schema proposals

None. The existing ET conventions cover every pattern encountered in
this section. Wave 1 ET soft-hyphen rule, Wave 3 running-header y<45
gate, and the shared drop-cap/subtitle/story-number rules all fit
cleanly.

## Counts

| Kind       | Count |
|------------|-------|
| heading    | 1     |
| paragraph  | 31    |
| **Total**  | **32** |

Per-page distribution:

| pdfPage | blocks |
|---------|--------|
| 264     | 4 (heading, subtitle, 2 body paragraphs) |
| 265     | 2      |
| 266     | 3      |
| 267     | 3      |
| 268     | 2      |
| 269     | 2      |
| 270     | 2      |
| 271     | 2      |
| 272     | 2      |
| 273     | 2      |
| 274     | 2      |
| 275     | 2      |
| 276     | 2      |
| 277     | 2      |

Total character count across all block text: 21,616.
