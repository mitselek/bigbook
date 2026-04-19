# story-aa-opetas-teda-kainust-kontrollima — extraction report

## Summary

Final story of the Estonian edition (English counterpart: story-aa-taught-him-to-handle-sobriety). Pages 585–591 (p592 is blank; included in `pdfPageEnd` per metadata hand-off). **30 blocks emitted**: 1 heading + 29 paragraphs. No bylines, footnotes, list-items, verses, or blockquotes present.

## Method

- `pymupdf` `page.get_text("dict")` for per-line spans with bbox/font/size
- Sort lines by `(pdf_page, y0, x0)` for reading order
- Line drops:
  - Top-of-page running headers/page numbers: `y0 < 45 AND (size <= 11.5 OR text.isdigit())`
  - Bottom-of-page page number `553` on p585: `text.isdigit() AND size <= 11.5 AND y0 > 520`
  - Story number `(15)` on p585 at y≈57.66: `50 <= y0 <= 65 AND starts/ends with parens`
- Heading detection: p585 lines with `13.5 <= size <= 15.0 AND 65 <= y0 <= 95` (two-line merge)
- Drop-cap: `BrushScriptStd` at `size >= 20` on p585 → glyph `K`
- Italic deck: p585 `y0` in `[108, 148]`, body-sized
- Body paragraph-start: `64 <= x0 < 80`; continuation at `x0 ≈ 56.69`
- Drop-cap wrap zone: p585 `y0 in [160, 200] AND x0 in [82, 95]` (wide `K`, +35 offset)
- Cross-page merge via right-margin carry-over (`x1 > 280 AND next x0 < 64`)
- Text normalization: ligatures → ASCII digraphs; NUL stripped; soft-hyphens (U+00AD) stripped at join; line-end U+002D preserved (ET rule); en-dash (U+2013) / minus (U+2212) space-padded

## Schema decisions

### Two-line heading merge (verified)

The PDF renders the title across two centered heading lines on p585:

- y=72.66: `AA ÕPETAS TEDA KAINUST`
- y=87.66: `KONTROLLIMA`

Both at size 14.0, NewCaledoniaLTStd, centered. Merged into a single heading block with a single space: `AA ÕPETAS TEDA KAINUST KONTROLLIMA`. Matches Wave 8's note that ET headings preserve `AA.` without expanding to `ANONÜÜMSED ALKOHOOLIKUD` — here the `AA` stays abbreviated, same visual as the source.

### Italic deck — mixed-font first line

The 3-line italic deck on p585 has a quirk: the first line (y=112.47, `„Kui jumal tahab, siis me…  ei pea ehk enam kunagi`) is reported as `NewCaledoniaLTStd` (regular) while lines 2–3 are `NewCaledoniaLTStd-It`. The opening low-9 quote `„` appears to break PyMuPDF's font-homogeneity detection for the line. I grouped all three lines by y-range (108..148) and emitted a single `paragraph` block per convention. The opening quote's different-font rendering is not a content distinction.

Source also has a double space after `me…` (`siis me…  ei pea`) that collapsed to single space under the whitespace-normalization rule. This is NOT a source fidelity concern — PyMuPDF often reports adjacent spaces as a visual kerning artifact.

### Drop-cap 'K' merge

Drop-cap `K` at (x=54.69, y=160.47, size=33) merged with the first body line `ui olin juba mõnda aega aja AAs olnud, ütles ` at (x=88.08, y=164.92) → `Kui olin juba mõnda aega aja AAs olnud, ütles…`. Wrap continuation at y=179.42 x=88.08 also absorbed. Normal body resumes at y=193.92 x=56.69.

### Story-number drop

`(15)` on p585 at y=57.66 is the decorative story-number. Dropped per conventions (do not emit in heading text). Gated explicitly since y=57.66 falls outside the `y0 < 45` running-header band.

### Italic sentence on p588 kept inline

p588 y=106.91 is an italic sentence `Pidin seda valu alkoholiga tuimestama.` in the middle of a body paragraph. Per conventions, italic alone is not a split signal — kept inline as part of `p016`.

## Front-matter verdicts

- **Heading**: present, two-line merge → `AA ÕPETAS TEDA KAINUST KONTROLLIMA` ✓
- **Story-number prefix `(15)`**: dropped ✓ (decorative, not authored content)
- **Subtitle/deck**: present as single `paragraph` block (3 source lines joined) ✓
- **Drop-cap**: `K` (BrushScriptStd ~33pt) merged with first-word tail ✓
- **Byline**: none (the story has no attribution sign-off — consistent with final-story layout)
- **Footnote**: none
- **List-item / verse / blockquote / table**: none

## Source quirks preserved verbatim

Per the ET conventions fidelity-over-correction rule:

- **p003** (`story-aa-opetas-teda-kainust-kontrollima-p003`): `"Kui olin juba mõnda aega aja AAs olnud"` — the doubled word `aega aja` appears in the PDF (p585 y=164.92 reads `mõnda aega aja AAs`). Likely a source typo (should read `mõnda aega AAs` or `juba aja AAs`), preserved verbatim.
- **p011**: `"kui mu laev New Yorgis peatus ."` — space before period preserved (p586 y=411.41: `peatus . Mesinädalatel`).
- **p027**: `"Õppides - töötades Kaheteist Sammuga"` — U+002D hyphen with surrounding spaces preserved (p590 y=454.91 reads `Õppides - töötades`). Unusual in ET which normally uses en-dash for mid-sentence dashes, but source has ASCII hyphen with spaces.
- **p029**: ends with `"nii tundlikud"` without a closing period — source (p591 y=251.91) has no period; preserved.

## Flagged blocks

- **p003 `aega aja`**: probable source typo, preserved. Flag for editorial review downstream if needed.
- **p011 space-before-period**: probable source typesetting artifact, preserved.
- **p027 ASCII hyphen with spaces**: atypical for ET; not altered.
- **p029 missing terminal period**: preserved; downstream may choose to add in display.

## Schema proposals

None. The existing conventions handled this story cleanly:

- ET two-line heading merge (Wave 8 pattern) applied
- Italic-deck mixed-font first-line grouping by y-range (not font) is a useful implicit pattern — already documented via size-band / y-band heuristics
- Inline italic sentences correctly remained in paragraph

No new rules surfaced.
