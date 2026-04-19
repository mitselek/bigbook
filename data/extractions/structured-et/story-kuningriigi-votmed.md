# story-kuningriigi-votmed — structured extraction report

## Summary

Extracted "Kuningriigi võtmed" (The Keys of the Kingdom) — Pioneer story #9, the last story in Part II.A (Pioneers of A.A.) before the Part II.B opener. 32 blocks emitted: 1 heading + 1 italic deck (as paragraph) + 30 body paragraphs. Exact block-count parity with English counterpart `story-the-keys-of-the-kingdom` (32 / 32, same kind distribution). No bylines, no lists, no verses, no footnotes, no blockquotes. Clean pass.

## Method

- `pymupdf.open` → `page.get_text("dict")` per line with font/size/bbox.
- Single pass over PDF pages 300..308 (the actual content range; the outline metadata covers 300..312, but pages 309-312 hold the Part II.B transition — `2. osa` on p309, `NAD LÕPETASID AEGSASTI` italic deck on p311 — which belong to a separate section).
- Line sort by `(page, y0, x0)`.
- Running-header drop: `y0 < 45 AND (size <= 11.5 OR digits)`. Caught the standard 11pt headers on pp301-307, the 10pt / 9.5pt header on p308, and the bottom `268` footer on p300.
- Story-number `(9)` drop on p300 (y≈83.64, matched via regex `^\(\d+\)\s*$`).
- Heading detection: p300 line at size 14 containing `KUNINGRIIGI` + `VÕTMED` (y≈102).
- Italic deck: p300 `-It` lines in y-band 120..150 (2 wrapped lines → 1 paragraph).
- Drop-cap: BrushScriptStd at size 33 on p300 (y≈161, glyph `V`). Wrap-zone x∈[82,95], y∈[160,195].
- Paragraph boundary: `64.0 <= x0 < 80.0` indent detection at x≈68.03.
- Cross-page merges: two transitions are new-paragraph (p300→p301, p304→p305 — both earlier page ends with period AND next page starts at indent x=68.03); six transitions are continuation-merges (p301→p302, p302→p303, p303→p304, p305→p306, p306→p307, p307→p308 — prior page ends without terminal punctuation AND next page opens at body-margin x=56.69).
- Line join: ET soft-hyphen (U+00AD) strip-and-join at join time; line-end U+002D preserved (authored compound); en-dash / minus space-padding heuristic honored. Soft hyphens cleaned at end via global replace.
- Ligature expansion, NUL strip applied at normalize time.

## Schema decisions

- **Story-number `(9)` dropped** per ET+EN conventions (decorative numbering, not authored content).
- **Italic deck treated as single paragraph** (2 wrapped lines, clearly one sentence). Default soft-subtitle rule applied.
- **Drop-cap `V` merged with `eidi`** → `Veidi rohkem, kui viisteist aastat tagasi...`. Wide-glyph wrap-zone offset +30 (x≈85) used for the 2 body lines that wrap around the drop-cap. No small-caps tail in ET.
- **Page range note**: metadata says `pdfPageEnd: 312`, but no story content appears past page 308. Pages 309-312 are either blank or contain the Part II.B opener (`2. osa`, `NAD LÕPETASID AEGSASTI`). Extraction script iterates only pp300..308. The output JSON retains the metadata `pdfPageEnd: 312` verbatim because that is the canonical metadata; extracted blocks carry their actual `pdfPage` values (300..308).
- **Embedded book title `„Anonüümsed Alkohoolikud"`** inline in p014, p019. Split across lines on p303 (one line in italic `-It`, one in regular) — kept in surrounding paragraph per conventions (italics alone is not a split signal).
- **`–` en-dash in p006, p014** (space-padded mid-sentence) preserved with spaces; **`−` minus sign in p032** (`kuuluvustunne − tahetud`) preserved with spaces. ET en-dash/minus rule fired correctly.

## Flagged blocks

None with uncertainty. Specific quick notes:

- `p003` drop-cap merge produced `Veidi rohkem, kui viisteist aastat tagasi...` — clean.
- `p004` contains an oddity: source line on p300 starts with a soft hyphen (`\xadScott Fitzgerald...`) after previous line `...John Held Juunior ja`. The leading U+00AD was swallowed by the trailing soft-hyphen cleanup pass, yielding `John Held Juunior ja Scott Fitzgerald` — correct result. No typesetter artifact leaked.
- `p014` contains `olemas­olust` split by soft hyphen on p303 — joined cleanly as `olemasolust`.
- `p032` final sentence: `Vastutasuks pudeli ja pohmelli eest on meile antud Kuningriigi Võtmed.` — story's titular close preserved.

## Schema proposals

None. All existing ET conventions applied cleanly. The `pdfPageEnd: 312` vs content-ends-at-p308 gap is a metadata-vs-content boundary issue, not a schema issue — each block carries its own `pdfPage` field.

## Front-matter verdicts

- `id`: `story-kuningriigi-votmed` — matches metadata.
- `kind`: `story` — matches.
- `title`: `Kuningriigi võtmed` — prose-case as provided; heading block preserves visual form `KUNINGRIIGI VÕTMED`.
- `parentGroup`: `personal-stories/pioneers-of-aa` — matches.
- `pdfPageStart`: 300, `pdfPageEnd`: 312 — preserved from metadata as-is (content occupies 300..308; 309..312 are transition to Part II.B).
- `bookPageStart`: 268, `bookPageEnd`: 280 — preserved from metadata; book-page 268 footer observed on PDF p300, 277 footer observed on PDF p309 (Part II.B opener page). Book-page 280 is not visible in extracted content (would be on PDF p312, blank in our probe).

## Counts

- Blocks: 32 (heading 1 + paragraph 31)
- ET vs EN block count: 32 / 32 — exact parity.
- ET chars 13273 / EN chars 14160 (ET is 93.7% of EN length — typical ET-is-shorter ratio for this book).
- ET words 1905 / EN words 2530.
- Pages covered by blocks: 300..308 (9 pages of content).
