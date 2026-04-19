# story-ka-naised-on-haiged

Wave 3 Estonian per-section extraction.

## Summary

Extracted the third Pioneers-of-AA personal story in the Estonian edition
(ET ordering). English counterpart: `story-women-suffer-too`. Pages 232–239
in the PDF, book pages 200–207. Emitted **22 blocks** total:

- 1 heading
- 21 paragraphs
- 0 list-items, 0 bylines, 0 verses, 0 footnotes, 0 blockquotes, 0 tables

The EN counterpart also emits 22 blocks with the same kind distribution
(1 heading + 21 paragraphs). ET matches EN exactly on block-structure
granularity.

## Method

Single-pass PyMuPDF `get_text("dict")` over pages 232..239 (1-indexed).
Lines sorted by `(pdf_page, y0, x0)` for reading order.

Running headers / page numbers dropped with the ET-refined rule
`y0 < 50 AND (size <= 11.5 OR pure digits)`. Bottom page numbers
dropped with `text.isdigit() AND size <= 11.5 AND y0 > 520`.
Story-number prefix `(3)` dropped by regex `^\(\d+\)\s*$` gated to
`pdf_page == 232 AND y0 < 60` (sits centered above the heading).

ET soft-hyphen (U+00AD) handling uses the Wave 1 join-time rule: strip
the soft hyphen when joining prev+curr, no space inserted. Many cross-line
splits in this section (58 in the raw probe); all resolved cleanly.

Paragraph-start detection: `x0 >= 64.0` (body margin ~56.7, first-line
indent ~68.0).

Drop-cap merge: 'M' (BrushScriptStd, size 33, at x=56.7 y=157) merged
with the first body line 'illest ma rääkisingi...' at (x=100, y=163) to
form 'Millest ma rääkisingi...'. Drop-cap wrap-zone: y ∈ [155, 200] AND
x0 ≥ 95 stays in the first paragraph regardless of x0 (handles the ~3
wrap-indent lines at x=100).

Italic deck: the 4 italic lines on p232 (y=92..137) grouped into a SINGLE
paragraph — only one first-line indent (y=92 x=68); subsequent lines sit
at body-margin x=56. Matches EN counterpart's single-paragraph deck.

## Schema decisions

1. **Heading visual form**: `KA NAISED ON HAIGED` — preserved the PDF's
   visual all-caps rendering. The section metadata `title` uses prose-case
   (`Ka naised on haiged`, starting lowercase `ka` as in the ET TOC) but
   the heading block emits the visual heading (all-caps, size 14.0
   NewCaledoniaLTStd at y=67). This honors the intentional
   title-vs-heading divergence documented in parent conventions.

2. **parentGroup**: `personal-stories/pioneers-of-aa` preserved from
   section metadata.

3. **Story-number prefix `(3)` dropped**: the numeric story-number at
   page 232 y=48.5 size=13.0 centered (x=186) is NOT emitted — per parent
   conventions: "Lean toward DROP — it is structural numbering, not
   authored content." This matches the EN counterpart's handling
   (story-women-suffer-too also drops its `(1)` prefix).

4. **Italic deck → 1 paragraph**: only one first-line indent observed
   (y=92 x=68), so emitted as a single paragraph per conventions default
   (multi-paragraph split only when multiple clear first-line indents
   are visible). EN counterpart also emits a single deck paragraph
   (`p002`).

5. **Drop-cap `M`**: BrushScriptStd 33pt, merged with first body line to
   form `Millest`. The drop-cap is at x=56.7 y=157; the first body line
   is at x=100.08 y=163 (wrap-indent past the drop-cap width). Wrap
   window y ∈ [155, 200] AND x0 ≥ 95 — within this zone,
   paragraph-start detection is suppressed.

6. **No byline**: neither the EN nor ET version of this story has an
   author sign-off. The story ends on the reflective sentence
   `„Sinu tahtmine sündigu, mitte minu,” ja seda ka tõepoolest mõelda.`
   as the final paragraph block (`p022`).

7. **No footnotes, verses, blockquotes, lists, or tables** observed in
   this section.

## Flagged blocks

**None flagged as uncertain.** Items worth noting for the record:

- **`p005`** is longer than most (~870 chars): spans bottom-of-p232 + top
  of p233 as a single narrative paragraph. The cross-page merge is
  natural because p232's final body line continues mid-word
  (`joo\xad` + `davat` on p233). EN `p005` has similar extent.

- **`p008`** is the longest paragraph (~1230 chars), covering the entire
  interior of p233-p234 ("That night I got very drunk..."). Matches EN
  `p008` in scope.

- **`p013`** contains a three-dash run (`ühest paigast teise – jätkates
  joomist. Õudustäratava salakavalusega oli alkohol muutunud minu jaoks
  esmatähtsaks. Ma ei tundnud temast enam mõnu − ta lihtsalt vaigistas
  valu −, kuid ma pidin teda saama.`). The first is U+2013 EN-DASH; the
  last two are U+2212 MINUS SIGN. Both are space-padded — joined with
  the prev-had-trailing-space rule preserving the padding. This
  verifies the Wave 1 ET dash rule continues to hold.

- **`p018`** contains `See ei olnud „religioon”– see oli vabadus!` where
  the en-dash is TIGHT (no surrounding space in the source line). My
  join preserved this as-is since both sides were on the same source
  line (no cross-line join occurred here). Confirmed against source.

## Dash verification

This section is dash-heavy. All mid-sentence dashes verified:

- U+2212 MINUS SIGN: 21 occurrences, all space-padded
- U+2013 EN-DASH: 5 occurrences (including one tight non-padded on p018)
- U+2014 EM-DASH: 0 (correctly absent in ET typesetting)
- U+00AD SOFT HYPHEN: 0 leaked into output (all resolved at join)

Example lines:
- `p005`: `toas − keldrikorteri elutoas` (U+2212, space-padded)
- `p011`: `Mu vanemad olid jõukad –` (U+2013, space-padded)
- `p018`: `See ei olnud „religioon”– see oli vabadus!` (U+2013, tight)

## Cross-line hyphenation audit

Sample joins verified:

- `külma-` + `värinad` → `külmavärinad` (soft-hyphen, p005)
- `kava-` + `kohaselt` → `kavakohaselt` (soft-hyphen, p011)
- `muinas-` + `jutt` → `muinasjutt` (soft-hyphen, p011)
- `Abielu-` + `lahutus` → `Abielulahutus` (soft-hyphen, p011)
- `joo-` + `davat` (cross-page p232→p233) → `joodavat` (soft-hyphen,
  p005, cross-page within same paragraph)

Intra-line U+002D hyphens preserved (observed):
- `üles-alla` (p005)
- (no other U+002D compound hyphens surfaced in body text)

## Running-header drop audit

No running headers leaked into body blocks:

- `ANONÜÜMSED ALKOHOOLIKUD` (even pages 234, 236, 238) — dropped at y=35
  size=11.0.
- `KA NAISED ON HAIGED` (odd pages 233, 235, 237, 239) — dropped at y=35
  size=11.0. The title-page heading at y=67.6 size=14.0 correctly emits
  as the section heading.

Page numbers (200..207) all dropped: they sit at y=35 (top) or y=530
(bottom) at size 11.0.

## Schema proposals

**None.** Existing ET Wave 1–2 conventions + EN baseline covered this
section cleanly. The story-number-drop rule, drop-cap `M` merge,
en-dash / minus-sign handling, soft-hyphen join, and running-header
gate all behaved exactly as documented.

Confirmations from this section:

- **Story-number `(3)` drop**: consistent with parent conventions
  ("Lean toward DROP") and with dr-bob's and women-suffer-too's
  handling. Adds a third data point.
- **Single-paragraph italic deck**: consistent with the default rule
  ("single paragraph unless multiple first-line indents visible").
  Deck had 4 lines with one first-line indent → one paragraph.
- **Wide-glyph drop-cap wrap-zone**: narrow-glyph +20 rule not needed;
  `M` is wide and naturally sits at the standard +35 offset. Used x0
  threshold 95 to gate the wrap zone (drop-cap at x=56, body wrap at
  x=100 — 43 units of offset).
