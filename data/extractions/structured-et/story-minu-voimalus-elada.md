# story-minu-voimalus-elada — extraction report

## Summary

Estonian personal story "Minu võimalus elada" (EN counterpart: "My Chance To Live", a
Part III "They Stopped in Time" story). PDF pp. 341–350, book pp. 309–318. Emitted
**42 blocks**: 1 `heading` + 41 `paragraph`. No bylines, no footnotes, no list
items, no verses, no blockquotes, no tables. Extraction is a clean single-voice
narrative with standard ET typographic signature (drop-cap + italic deck +
running-body text). No section-local quirks required beyond the standard ET
convention set. Three soft-hyphen join outcomes are flagged as source-faithful
quirks (two render as grammatically odd joins in ET, preserved verbatim).

## Method

- `pymupdf.open(PDF)` → iterate pages 341–350.
- `page.get_text("dict")` → per-line spans with bbox / font / size.
- Sort by `(page, y0, x0)` for reading order.
- ET running-header drop rule (`y0 < 45 AND (size <= 11.5 OR text.isdigit())`)
  removed the top-of-page `ANONÜÜMSED ALKOHOOLIKUD` / `MINU VÕIMALUS ELADA`
  banners and their page numbers (310, 311, 312, 313, 314, 315, 316, 317, 318).
- Story-number `(5)` on page 341 at `y≈52.83, size=13` matched the decorative
  story-number regex and was dropped entirely per both EN and ET conventions.
- Bottom-of-page number `309` at `y≈530.79, size=11` on page 341 dropped via
  `stripped.isdigit() and size <= 11.5 and y0 > 520`.
- Heading `MINU VÕIMALUS ELADA` detected at `size=14.0` on page 341 (centered
  at `x≈109.52`).
- Italic deck (two wrapped lines at `NewCaledoniaLTStd-It`, `y` 97.04 / 111.54)
  joined into a single paragraph block.
- Drop-cap `A` in `BrushScriptStd` at `size=33.0` merged with the first body
  fragment `'stusin sisse Anonüümsete ...'` → `'Astusin sisse Anonüümsete ...'`.
  The drop-cap wrap-zone `(y ∈ [130, 160], x ∈ [82, 95])` kept lines that wrap
  around the glyph attached to the opening paragraph (not new paragraphs).
- Body paragraphs detected via first-line indent `x ∈ [64, 80)` (paragraph-start
  at `x≈68.03`, continuation at `x≈56.69`).
- ET line-join rules: strip U+00AD soft hyphen at join time; preserve line-end
  U+002D as authored compound (ET Wave 4); en-dash/minus with trailing space
  joined with space (space-padded mid-sentence dash). No U+2014 em-dashes present.

## Schema decisions

- **No bylines.** This story has no author attribution sign-off on page 350; it
  ends with the narrator's direct prose ("Kõik sellepärast, et mul oli
  valmisolek uskuda, et AA võib ka mind aidata."). Story-kind with no byline is
  allowed per EN/ET schema.
- **Italic deck as single paragraph.** The deck is two wrapped lines of a single
  sentence (not a multi-paragraph structured description), so the default
  single-paragraph rule applies.
- **Story-number `(5)` dropped.** Per convention, decorative numbering is not
  authored content.
- **Drop-cap merge.** `A` + `stusin` → `Astusin` (no space; drop-cap is the
  first letter of the opening word).
- **No proper-noun capitalization fixup needed.** The drop-cap tail flattens to
  regular case automatically; the first word `Astusin` is sentence-initial
  capitalized correctly.
- **No em-dash handling fired.** The story uses U+2212 MINUS SIGN (`−`) for
  mid-sentence dashes (e.g. p012: `teisi aineid ma lisaks tarvitan − otsitud
  kergendust`, p013: `mu ema nuttis endiselt − ja kõik oli minu süü`, p031:
  `inimest võlukepiga − sellist inimest`). These are space-padded and joined
  with space preserved. No U+2014 em-dashes in this section.

## Flagged blocks

- **`p014`** — `"...oma põhja suunasvaid paar aastat..."`. Source PDF rendered
  `suunas` with a U+00AD soft hyphen at line-end followed by `vaid` on the next
  line. Strip-and-join per ET rule produces `suunasvaid`, which is grammatically
  odd (the Estonian reading wants `suunas vaid`, two separate words). Treated as
  a source quirk and preserved verbatim, matching the documented ET pattern
  ("if the PDF renders a character, preserve it — fidelity beats correctness").
- **`p039`** — `"...palju võimalusi areneiseks."`. Similar source quirk. The
  Estonian intent is `arenemiseks` ("for development"), but the PDF renders
  `are` + soft-hyphen + `neiseks`. Strip-and-join yields `areneiseks`, preserved
  verbatim. This appears to be a typesetting/hyphenation bug in the source PDF
  (the syllable `mi` is missing), not in the extractor.
- **`p022`** — `"sündmusteahela"`. This one is a clean mid-line soft-hyphen
  strip (no line break involved): the PDF rendered `sündmuste\xadahela` as a
  single logical word with an embedded discretionary hyphen. Strip produces the
  correct Estonian compound `sündmusteahela` ("chain of events"). Not a quirk;
  just noted for completeness because it visually resembles the other two cases.

## Front-matter verdicts

- `id`: `story-minu-voimalus-elada` — matches prompt metadata.
- `kind`: `story` — matches.
- `title`: `Minu võimalus elada` — matches prompt (prose-case); heading block
  preserves visual rendering `MINU VÕIMALUS ELADA`.
- `parentGroup`: `personal-stories/they-stopped-in-time` — matches prompt.
- `pdfPageStart`: 341 / `pdfPageEnd`: 350 — matches PDF extent; first block is
  on page 341, last block is on page 350.
- `bookPageStart`: 309 / `bookPageEnd`: 318 — matches; confirmed by the
  visible page numbers at page top (`310`..`318`) and page bottom of p341
  (`309`).

## Schema proposals

None. Standard ET convention set handled this section cleanly. The three
soft-hyphen source quirks are already covered by the existing "preserve
verbatim" rule; no new rule needed.

## Block counts

| kind      | count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 41    |
| **total** | 42    |

Per-page distribution:

- p341: 1 heading + 5 paragraphs (italic deck + intro + 4 body)
- p342: 5 paragraphs
- p343: 4 paragraphs
- p344: 4 paragraphs
- p345: 5 paragraphs
- p346: 5 paragraphs
- p347: 3 paragraphs
- p348: 3 paragraphs
- p349: 5 paragraphs
- p350: 2 paragraphs
