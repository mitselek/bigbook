# story-oleks-voinud-ka-hullemini-minna — extraction report

## Summary

Part-III "they stopped in time" story, PDF pages 380–390 (book pages 348–358). 42 blocks emitted: 1 heading, 1 italic-deck paragraph, 40 body paragraphs. No byline, list-items, verses, footnotes, or blockquotes. All cross-page transitions verified as mid-paragraph continuations; no cross-page paragraph split signals triggered.

## Method

- PyMuPDF `get_text("dict")` over pages 380–390.
- Single script at `.tmp/extract-hullemini.py`.
- Sort per-page lines by `(y0, x0)`, global sort by `(pdf_page, y0, x0)`.
- Running-header drop: `y0 < 45 AND (size <= 11.5 OR digits-only)` per ET Wave-3 refinement.
- Bottom numeric footer (page 380 shows `348` at y≈530.79, size 11) dropped by `digits AND size<=11.5 AND y0>520`.
- Last-page (p390) running header at `y≈35.16` (ANONÜÜMSED ALKOHOOLIKUD, size 10) and page number `358` (size 9.5) were re-sorted by PyMuPDF to the tail of the page's line list but still satisfied the `y0 < 45` gate — dropped cleanly.
- Story-number `(9)` on p380 (y≈68.83, size=13) dropped per ET convention (decorative structural numbering, not authored content).
- Soft-hyphen (U+00AD) cross-line joins: strip-and-join no-space at paragraph-join time.
- En-dash (U+2013) / minus-sign (U+2212): space-padded in the source; preserved with surrounding spaces.

## Schema decisions

- **Heading divergence from metadata title** — the metadata `title` field is `Oleks võinud ka hullemini minna` but the printed heading on page 380 reads `OLEKS VÕINUD KA KEHVEMINI MINNA`. Preserved the source text verbatim per the conventions' "divergence between metadata title and heading block is intentional" rule, and per the ET fidelity-over-correction principle. "Kehvemini" vs "hullemini" is a translator's wording choice in the typeset edition; both mean "worse".
- **Italic deck as single paragraph** — the 3-line italic deck (NewCaledoniaLTStd-It, y≈113..142) is a single wrapped sentence-pair, not multi-paragraph. Emitted as one `paragraph` per the Wave-3 default ("single-paragraph unless clear multi-paragraph indent signals").
- **Story-number `(9)`** dropped entirely (not merged into heading text). Per conventions "lean toward DROP — it is structural numbering, not authored content".
- **Drop-cap `K`** at (x=56.69, y=160.72, BrushScriptStd, size=33) merged into the first body word: `K` + `uidas` → `Kuidas`. First body line wraps at x≈90; subsequent body lines on the same y-band also absorbed into the first paragraph via drop-cap wrap-zone detection.
- **No byline** — this story has no sign-off. The final paragraph is authored prose (`Üle kõige olen ma AA-le tänulik...`) ending at size 12.50 body font on a non-indented line; it is continuation of the section body, not a distinct byline typographic region.

## Flagged blocks

None flagged. All 42 blocks have clean provenance:

- `h001` — heading confirmed at size 14 on page 380.
- `p002` — italic deck, 3 source lines, single joined paragraph.
- `p003` — drop-cap paragraph (`Kuidas saab...?`), 3 lines merged from drop-cap + wrap-zone.
- `p004`–`p042` — body paragraphs, first-line-indent paragraph-start at x≈68.03 detection.

## Cross-page merges verified

Every page transition lands mid-paragraph (confirmed by probe — no page-top line at x=68.03 paragraph-start x-coordinate):

- 380→381: ...raisa- / tud ajast → `raisatud ajast` (soft hyphen join)
- 381→382: ...kainus- / perioodid → `kainusperioodid`
- 382→383: ...tagasi ka / siis, kui → `tagasi ka siis`
- 383→384: ...äraole- / kusse → `äraolekusse`
- 384→385: ...„Ano- / nüümsed → `„Anonüümsed`
- 385→386: ...noorelt / jooma hakanud → `noorelt jooma hakanud`
- 386→387: ...Esmakord- / sel AA-sse → `Esmakordsel`
- 387→388: ...eesmärgiks on / taoliste → `on taoliste`
- 388→389: ...kahjusta- / nud oleme → `kahjustanud`
- 389→390: ...„Anna meile meelerahu leppida / asjadega → `leppida asjadega`

## Schema proposals

None — conventions cover this section cleanly.

## Counts

- Blocks: 42
- Kinds: heading=1, paragraph=41
- Pages represented: 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390 (all 11 pages in range contribute at least one block; 380 has heading + deck + drop-cap paragraph + 3 more paragraphs)
