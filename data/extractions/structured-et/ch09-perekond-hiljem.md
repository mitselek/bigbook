# ch09-perekond-hiljem — extraction report

## Summary

Estonian chapter 9 "Perekond hiljem" ("The Family Afterward") extracted from
PDF pages 154–167 (book pages 122–135). **48 blocks emitted** (1 heading,
47 paragraphs). Exact block-count parity with the EN counterpart (also 48).
No footnotes, no list-items, no verse, no blockquotes. The three closing
italic mottoes on page 167 are emitted as three separate paragraph blocks
per Wave 6 ET precedent.

## Method

- PyMuPDF `page.get_text("dict")` for per-line spans (font, size, bbox).
- Running header drop: `y0 < 45 AND (size <= 11.5 OR text.isdigit())`
  (ET convention Wave 3).
- Page-number drop at page bottom: `y0 > 520 AND size <= 11.5 AND digit`
  (catches the `122` at y=530.8 on opening page 154).
- Chapter label `9. peatükk` (italic 12.5pt) dropped via regex
  `^\d+\.\s*peatükk\s*$`.
- Heading detection: `size >= 13.0 AND size <= 15.0 AND text.upper().startswith("PEREKOND HILJEM")`
  on page 154. The heading lives at y≈70.7 (above the drop-cap / body).
- Drop-cap: glyph `M` at BrushScriptStd size 33.0 on page 154, merged with
  the first body line `eie naisliikmed…` → `Meie naisliikmed…` (no space).
- Drop-cap wrap zone: first 2 body lines at x=100.1 (y ≤ 120) stay in the
  first paragraph; body returns to x=56.7 thereafter.
- Paragraph-start detector: `x0 in [64.0, 80.0]` (first-line indent ≈ 68pt;
  body left margin 56.7pt).
- Soft-hyphen (U+00AD) cross-line join: strip + no space at join time.
  Verified clean on words like `elukorraldusega`, `kuitahes`,
  `minevikujuhtumit`, `kasvuraskusi`, `päevavalgele`, `kahtlusevarjuta`.
- Cross-line U+002D: Wave 4 ET rule — preserve hyphen and join without
  space (authored compounds). Confirmed intact on `Võib-olla`, `Aeg-ajalt`.
- En-dash / minus space-padded join per ET convention (tracked via the raw
  line's trailing space before rstrip).
- Page transitions: if the first line on a new page is NOT a paragraph
  start (no first-line indent), treat as continuation of the previous
  paragraph. This merged several mid-paragraph page splits correctly
  (e.g. p154→p155, p155→p156, p157→p158).

## Schema decisions

- **Heading text is `"PEREKOND HILJEM"`** (uppercase, as visually rendered).
  Metadata `title` stays prose-case (`"Perekond hiljem"`). Per Wave 1B
  convention.
- **Three closing mottoes emitted as three paragraph blocks**
  (`p046`, `p047`, `p048`). Per Wave 6 deferred note: these are currently
  emitted as paragraphs (no `motto` kind). They share the signature of
  italic `NewCaledoniaLTStd-It` at 12.5pt, centered (x0=130.4) on
  page 167 at y=484.2 / 498.7 / 513.2. Detected via `y0 > 470 AND x0 > 100
  AND "-It" in font` on page 167.
- **No footnotes** in this chapter. Unlike ch08 which has 2 footnotes,
  ch09 runs body-only through the end of page 167.
- **p045 "Meil on siinkohal kolm väikest asjakohast juhtmõtet. Siin need on:"**
  is the lead-in sentence to the mottoes. Kept as a regular paragraph; the
  mottoes immediately follow as separate blocks.

## Flagged blocks

None. All 48 blocks read cleanly. Specific checks:

- `p002`: drop-cap merge — first sentence correctly reads
  `"Meie naisliikmed on alkohoolikute abikaasadele soovitanud mõningaid
  hoiakuid, mida võtta terveneva mehe suhtes."`
- `p008`: contains `elukorraldusega` (soft-hyphen join of `elu­` + `korraldusega`).
- `p044`: contains en-dash with space-padding preserved:
  `"Loomulikult meie sõber eksis − eksis rängalt."` (U+2212 minus sign).
- `p046`–`p048`: three italic mottoes, each emitted on its own line with
  the trailing period preserved.

## Schema proposals

None from this section. The Wave 6 deferred `motto`/`aphorism` block-kind
question remains open. Ch09's three closing mottoes match the EN ch09
pattern — three `paragraph` blocks is the current precedent.

## Block-count comparison with EN

- EN ch09: 48 blocks
- ET ch09: 48 blocks — exact parity. Strong structural alignment confirmed.
