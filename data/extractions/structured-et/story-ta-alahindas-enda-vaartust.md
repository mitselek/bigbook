# story-ta-alahindas-enda-vaartust

## Summary

Estonian pioneer story #8, "Ta alahindas enda väärtust" (EN counterpart: "He Sold
Himself Short"). PDF pages 290–299, book pages 258–267. Emitted 41 blocks:
1 heading + 1 italic deck (paragraph) + 33 body paragraphs + 6 list-items
(the Six Steps). No byline, no verse, no footnote, no blockquote. No facsimile,
no TOC, no table.

## Method

- PyMuPDF `get_text("dict")` per page; lines sorted by `(page, y0, x0)`.
- Running headers/page numbers dropped via ET rule: `y0 < 45 AND (size <= 11.5
  OR text.isdigit())`. The story-number `(8)` on page 290 at y≈141 was dropped
  via a page-scoped rule: `y in [135, 150] AND text starts "(" and ends ")"`.
  Bottom-of-page footer `258` on p290 (y≈530) dropped via `y > 520 AND digit-only`.
- Heading detected by font-size band 13.5–15.0 AND text starts with "TA ALAHINDAS".
- Italic deck (p290, y=186/200, size 12.5 NewCaledoniaLTStd-It) emitted as a
  single paragraph block (default ET convention, two wrapped lines = one logical
  sentence).
- Drop-cap 'K' (BrushScriptStd, 33pt, p290 y=218) merged with the first body
  fragment at x≈86 y≈223 → `Kasvasin`. Drop-cap wrap-zone spans y∈[218, 250],
  x∈[82, 90]; body lines in that box are paragraph continuations, not new
  paragraphs.
- Body paragraph boundary: first-line indent `x ∈ [64, 80)` (≈68.03);
  continuations start at `x ≈ 56.69`.
- Six-Step list detected on pp294-295 by regex `^[1-6]\.\s` AND `60 ≤ x ≤ 75`
  AND size ≤ 13. Item 2 wraps onto a continuation line starting with
  leading whitespace ("     saamine."); that line was joined via the rule
  "list-item continuation = non-marker line AND raw text begins with space".
  (Important: the paragraph following item 6 also starts at x≈68 but has NO
  leading whitespace, so it cleanly starts a new paragraph block.)
- Cross-page paragraph merge: last paragraph bridged p298 (last line ends at
  "Küll aga on mu varanduseks") → p299 (body continues at x=56.69 "mu
  varanduseks sõprussuhted..."). Merge triggered because the last line on p298
  has `x1 > 280` AND the first line on p299 has `x0 < 64` (continuation, no
  indent).
- Join rules: ET soft-hyphen (U+00AD) at line-end → strip and join no-space
  (104+ splits across this section). No U+002D cross-line splits observed.
  En-dash / minus-sign behavior from ET conventions (space-padded if surrounding
  space present; tight otherwise). No ligatures other than standard were
  encountered. No NUL-byte artifacts.

## Schema decisions

- **Italic deck as single paragraph** — default ET convention; the two lines on
  p290 form a single sentence.
- **Drop-cap merge** — standard: `K` + `asvasin üles...` → `Kasvasin üles...`.
  No space inserted (first word continuation), consistent with ET conventions.
- **Story-number `(8)` dropped** — per conventions, structural numbering is not
  authored content.
- **Six Steps emitted as 6 `list-item` blocks** — matches EN counterpart's
  6 steps. The Estonian source numbers them 1.–6. in arabic numerals at x≈68.
  Item 2 spans two visual lines; its continuation ("     saamine.") joins into
  the same block.

## Flagged blocks

None — no uncertain decisions. The prose joins cleanly (soft hyphens, compound
preservations like `edasi-tagasi`, `kaks-kolm`, `saja-aastaseks`, `kolme-nelja`,
`paari-kolme`, `AA-lane`, `AA-s` all preserved correctly via the strip-only-if-
lowercase rule or by virtue of being intra-line tokens).

Source quirks preserved verbatim:
- `dr Bob` / `Dr Bob` / `Bill W` / `Bill D` — no period after single-letter
  initials (matches ET convention from earlier waves: `Bill W,`-style no-period
  names).
- `Akroni` / `Akronisse` proper-noun forms preserved throughout.
- `materjaalsete` (p294 `kui rõõmsad nad vaatamata oma materjaalsete vahendite
  nappusesele`) — source typo for `materiaalsete`. Not fixed.
- `nappusesele` — source typo (probably `nappusele`). Not fixed.
- `kaheksast-üheksast` and `seitsmest või kaheksast` — intra-line hyphens
  preserved as authored.
- `„...”` and `”` Estonian curly quotes preserved (e.g. `„Kui sina oled õigel
  teel... jätkama kontaktide loomist”`).

## Six Steps list (verbatim extracted)

1. Täielik enese kahandamine.
2. Sõltumine Kõrgemast jõust ja temalt juhatuse saamine.
3. Moraalne inventuur.
4. Pihtimine.
5. Hüvitamine.
6. Jätkuv töö teiste alkohoolikutega.

These are the ET rendering of the historic "Six Steps" that predate the Twelve
Steps. Bob described them to the narrator on the last day of his first Akron
trip (p294 y=440 onwards).

## Counts

- **Total blocks:** 41
- **heading:** 1
- **paragraph:** 34 (italic deck + 33 body)
- **list-item:** 6
- **byline / verse / footnote / blockquote / table:** 0

## Schema proposals

None. ET conventions covered all cases encountered:
- Soft-hyphen join mechanism (Wave 1 finding) handled ~60+ cross-line splits.
- ET running-header rule (y<45, size≤11.5) handled all page-top artifacts.
- Drop-cap BrushScriptStd 33pt at top-left worked as expected.
- Six-Step list detection via hanging-indent + regex is a clean local
  heuristic; leading-whitespace signal cleanly distinguishes continuations
  from the following paragraph start. Worth documenting in ET conventions
  as a list-continuation heuristic if this pattern recurs (the English
  counterpart had the same 6-item list, so future ET pioneer stories may
  reuse this detection).
