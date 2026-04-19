# story-koduperenaine-kes-joi-kodus — extraction report

## Summary

Structured extraction of "Koduperenaine, kes jõi kodus" (Estonian translation of
"The Housewife Who Drank at Home"). PDF pages 327–332 (1-indexed), book pages
295–300. Third story (story-number `(3)`) in Part II.B / **They Stopped in Time**
(`parentGroup: personal-stories/they-stopped-in-time`).

Emitted **18 blocks**: 1 heading + 17 paragraphs. No list-items, verse, footnotes,
tables, blockquotes, or bylines. **Block count matches EN counterpart exactly**
(EN: 1 heading + 17 paragraphs = 18).

**Heading divergence from EN:** the EN counterpart renders the title on two
centered lines (`THE HOUSEWIFE WHO DRANK` / `AT HOME`) and merges them into a
single `heading` block. **ET renders the title on a single line:**
`KODUPERENAINE, KES JÕI KODUS` at size 14 NewCaledonia, y=59.62, x=74.90 on
page 327. No two-line merge needed. Fits within one line because the Estonian
title is shorter when typeset.

## Method

- **Library:** PyMuPDF (`pymupdf`); `page.get_text("dict")`. No `pdfplumber`.
- **Heuristics fired:**
  - ET running-header drop: `y0 < 45 AND (size <= 11.5 OR text.strip().isdigit())`
    — caught `ANONÜÜMSED ALKOHOOLIKUD` (even-page banner), `KODUPERENAINE, KES JÕI KODUS`
    (odd-page banner at y=34.99), and `295`-`300` page numbers at top.
  - Bottom-of-page numeric footer drop: pure digit + size<=11.5 + y0>520 (caught `295` on p327).
  - Story-number `(3)` at y=40.53 size=13.0 on page 327 dropped as structural numbering.
  - Heading detection: size 13-15 on page 327 containing `KODUPERENAINE`.
  - Italic deck: NewCaledoniaLTStd-It, y 84-115 on page 327 → single paragraph.
  - Drop-cap detection: font starts with `BrushScript`, size ≥ 20pt → `J` at y=129 x=56, size 33pt.
  - Drop-cap merge: `J` + first body fragment `uhtumisi räägib minu lugu...` = `Juhtumisi...`
    (no space). Narrow-glyph wrap-zone (x ≈ 80, y in [145..160]) treats the second
    wrap line (`naisest: sellisest, kes kodus joob.`) as continuation of the same paragraph.
  - Paragraph-start detection: `x0 >= 64.0` (body margin ≈ 56.7, indent ≈ 68.0).
  - ET soft-hyphen line-join: strip U+00AD at line-end, join no-space.
  - ET line-end U+002D preserved as authored compound (Wave 4 ET rule).
  - ET space-padded en-dash / minus at line-end: join with space when preceded by space.

## Schema decisions

- **Single-line heading (`h001`):** the title occupies a single centered line on
  page 327 — `KODUPERENAINE, KES JÕI KODUS` at size 14 NewCaledoniaLTStd. No
  merge of lines required. The EN counterpart's two-line split
  (`THE HOUSEWIFE WHO DRANK` / `AT HOME`) does NOT recur in ET. Section metadata
  `title` is prose-case `"Koduperenaine, kes jõi kodus"`.
- **Italic deck (`p002`):** 3 italic lines on page 327 at y=84.74 (x=68, indent),
  y=99.24 (x=56, body margin), y=113.74 (x=56). Single first-line indent group →
  one `paragraph` block per the Wave 3 ET convention. Reads:
  "Ta peitis oma pudelid riidekorvidesse ja riidekapi sahtlitesse. AA-s avastas
  ta, et ei ole midagi kaotanud, küll aga leidnud kõik."
- **Drop-cap merge (`p003`):** `J` (BrushScriptStd 33pt, x=56.69 y=129.00) +
  first body fragment `uhtumisi räägib minu lugu ühte kindlat tüüpi `
  (NewCaledoniaLTStd 12.5pt, x=80.31 y=135.45) → `Juhtumisi räägib minu lugu
  ühte kindlat tüüpi ...`. No space (ET convention: body continues at normal
  size immediately after drop-cap; narrow-glyph `J` uses +20 wrap offset).
- **Story-number `(3)`:** dropped per conventions (structural numbering, not authored content).
- **No byline:** story ends on page 332 at y=353.41 with
  `"...Tema väesse, mis on nüüd minuga kõiges, mida ma teen."` No sign-off.
  Checked page 333 — it starts the next story `(4) ARST, RAVI ISEENNAST!`.
- **Cross-page paragraph boundaries** (right-margin carry-over heuristic applied
  implicitly via first-line-indent detection):
  - 327→328 (within p006): page 327 last body line ends with
    `"...aitas alustada ainult joomist."` (complete sentence); page 328 next
    content at y=48.91 x=56.69 continues `"ja kasvasid kiiresti..."` (no indent),
    but the content is structurally within the same paragraph block p006 →
    merged via no-indent continuation. Correct.
  - 328→329 (within p008): page 328 ends `"...jõin end magama."` (period);
    page 329 starts at x=68.03 (indent) `"Ma ei teadnud..."` → new paragraph p009. Correct.
  - 329→330 (within p011): page 329 ends mid-sentence `"...sest „nad "`;
    page 330 starts at x=56.69 `"kõik üritavad sisse piiluda"..."` → merged
    into p011. Correct.
  - 330→331 (within p014): page 330 ends mid-sentence
    `"...selle esimese "`; page 331 starts at x=56.69 `"joogi juurde tagasi jõudma..."`
    → merged into p014. Correct.
  - 331→332 (within p017): page 331 ends mid-sentence `"...Tasa "`; page 332
    starts at x=56.69 `"ja targu, esmased asjad kõigepealt..."` → merged. Correct.

## Compound-hyphen / diacritic preservation spot-checks

- `aeg-ajalt` (p006) — preserved.
- `võib-olla` (p009) — preserved (intra-line).
- `edasi-tagasi` (p011) — preserved.
- `AA-l`, `AA-s`, `AA-le`, `AA-sse` — all preserved (ET `AA-` affixation).
- `ringi­ratast` / `riide­korvidesse` / `tolmu­imeja` / `juha­tuses` — soft-hyphen
  line-splits correctly joined: `ringiratast`, `riidekorvidesse`, `tolmuimeja`,
  `juhatuses`.
- ET curly quotes `„…"` preserved throughout (e.g. `„tagavarade"`,
  `„Jekyll ja Hyde"`, `„Miks te ei proovi..."`).
- En-dash / minus: p003 has `"– ilma alkoholita"` (padded U+2013 preserved).
  p011 has `"– ma ei tea mis"` rendered with U+2212 minus sign and surrounding
  spaces — correctly preserved as space-padded.

## Flagged blocks

None. All 18 blocks look clean on inspection; no defects flagged.

## Schema proposals

None — this section exercised only established ET conventions. The main finding
(single-line heading in ET where EN is two-line) is a per-language typographic
difference that doesn't require a conventions change: both "single-line" and
"multi-line with merge" are already supported and agents are expected to emit
what the source shows.

## Verdict vs front-matter (metadata vs source)

- `id`: `story-koduperenaine-kes-joi-kodus` — matches prompt.
- `kind`: `story` — matches.
- `title`: `Koduperenaine, kes jõi kodus` — prose-case metadata; the heading
  block preserves visual ALL-CAPS `KODUPERENAINE, KES JÕI KODUS`. Intentional
  divergence per parent conventions.
- `parentGroup`: `personal-stories/they-stopped-in-time` — matches.
- `pdfPageStart` / `pdfPageEnd`: 327 / 332 — matches. Confirmed:
  - page 327 begins the story (story-number + heading + deck + drop-cap).
  - page 332 ends the story at y=353.41; page 333 begins `(4) ARST, RAVI ISEENNAST!`.
- `bookPageStart` / `bookPageEnd`: 295 / 300 — matches (page-footers observed
  `295` on p327 bottom; `296`..`300` as top-of-page running page numbers on p328..p332).
