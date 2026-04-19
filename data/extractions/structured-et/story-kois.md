# story-kois — extraction report

## Summary

Extracted `story-kois` (EN counterpart: `story-tightrope`, the 10th Part-III personal story, "they-stopped-in-time" group). PDF pages 391–400 (book pages 359–368). Emitted **29 blocks**: 1 heading, 28 paragraphs. No verses, no list items, no footnotes, no byline, no blockquotes, no tables. Text is clean — no soft-hyphen leaks, no ligature artifacts, no NULs, no double spaces.

## Method

PyMuPDF only (`page.get_text("dict")`), sorted by `(pdf_page, y0, x0)`. Heuristics used:

- **Running-header drop**: `y0 < 45 AND (size <= 11.5 OR text.strip().isdigit())` — pages 392–400 each have a two-piece header at y≈35 (book title + page number on even pages; chapter-title + page number on odd pages). Page 391 has no top-of-page header (first page of the story).
- **Story-number drop**: page 391 has `(10)` at y≈96.59, size 13, NewCaledoniaLTStd. Suppressed per ET conventions (decorative numbering, not authored content).
- **Bottom-of-page digit drop**: page 391 has `'359'` at y≈530.79 (book page number rendered at the bottom of the story opener) — dropped via `isdigit AND size<=11.5 AND y>520`.
- **Heading detection**: font size 13.5–15.0 on page 391, centered (`KÖIELKÕND` at size 14, x≈150).
- **Deck detection**: italic NewCaledoniaLTStd-It lines on page 391 in y-band [130, 180]. Three wrapped lines merged into a single `paragraph` block (the ET conventions default).
- **Drop-cap detection**: BrushScriptStd at ≥20pt on page 391. `A` glyph at size 33, y≈188.49. Merged into first body line as `A` + `lkoholi…` = `Alkoholi…`.
- **Drop-cap wrap zone**: `y in [188, 215] AND x in [82, 95]` on page 391 — the first two wrap lines at x≈89.08 sit to the right of the drop-cap; marked as in-paragraph continuations, not new paragraph starts.
- **Paragraph-start detection**: `64.0 <= x0 < 80.0` — body first-line indent is at x=68.03; continuation is at x=56.69; drop-cap wrap is at x=89.08.
- **Line-join rules**: ET soft-hyphen (U+00AD) strip-and-join-no-space; trailing U+002D preserved (ET Wave 4); en-dash / minus-sign space-padded when trailing space detected; em-dash (U+2014) tight-join.
- **Cross-page paragraph merge**: implicit via the paragraph-start gate — pages 392–400 all begin with either an indented line (new paragraph) or a continuation line at x=56.69 (merge into current paragraph). Inspected each page transition; all behaved correctly.

## Schema decisions

- **Heading is the visible rendering, not the metadata title.** Metadata says `title: "Köis"` (rope). The visible heading in the PDF is `KÖIELKÕND` (tightrope walk). Preserved verbatim per conventions (heading = visual content; title = metadata label). This is an intentional divergence, parallel to `Bill's Story` vs `BILL'S STORY`.
- **Story-number `(10)` dropped entirely**, per the EN convention (Wave 1B ch01) and ET precedent.
- **Italic deck** (3 lines) emitted as a single paragraph (`p002`) — no visible multi-paragraph indent structure.
- **No byline** — the EN counterpart also has no end-of-story signature.
- **No list items / verses / footnotes** — content is continuous autobiographical prose.

## Block distribution

- Page 391: 4 blocks (h001 heading, p002 deck, p003–p004 body)
- Page 392: 4 blocks
- Page 393: 3 blocks
- Page 394: 3 blocks
- Page 395: 3 blocks
- Page 396: 2 blocks
- Page 397: 4 blocks
- Page 398: 3 blocks
- Page 399: 3 blocks (p029 spans 399→400; `pdfPage` stored as 399 = start page)
- Page 400: (merged into p029)

## Flagged blocks

None of concern. Spot-checked numerous soft-hyphen joins — all produce correct Estonian words:

- p004: `kolledžisse`, `kingitus` (from `kolled­žisse`, `kin­gitus`)
- p005: `mõningast`, `lähenemiskatseid`, `ebaõnnestunud`
- p007: `kindlat`, `õigusteaduskonda`, `mitmeid`
- p008: `kolmanda`, `väljakannatamatuks`
- p009: `lõpetan`, `sarmikas`
- p012: `süvenev`, `juhtumite`, `ebameeldivalt`
- p015: `hommikul`, `toidukarbid`, `enesehaletsust`, `enesetapule`
- p020: `vaidlemist`, `küsimusi`, `küsimustele`
- p029: `leppinud`, `ühendusega`, `rahvusvaheline` (last one crosses p399→p400 boundary)

ET curly quotes preserved: 6 pairs of `„` / `”` (p005, p013, p018, p019, p023, p025).

## Front-matter verdicts

- `title` verdict: **kept as metadata** (`"Köis"`). Visible heading is `KÖIELKÕND` (different lexeme, "tightrope walk"). Both are authored; the split matches the EN `Bill's Story`/`BILL'S STORY` precedent.
- `parentGroup` verdict: `personal-stories/they-stopped-in-time` — matches metadata.
- `pdfPageStart`/`pdfPageEnd`: 391/400 — matches the PDF layout; heading detected on 391, text extends onto 400.
- `bookPageStart`/`bookPageEnd`: 359/368 — confirmed from the bottom-of-page-391 digit `'359'` that was dropped, and the top-of-page-400 digit `'368'` in the running header.

## Schema proposals

None. The existing EN + ET conventions handled this story cleanly on the first run.
