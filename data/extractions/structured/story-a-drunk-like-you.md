# story-a-drunk-like-you — extraction report

## Summary

Structured extraction of "A Drunk, Like You" (PDF pages 409–417, 1-indexed).
Part II.B / **They Stopped in Time**, story number (15) in the visual
numbering. 9 pages.

Emitted **32 blocks**: 1 heading + 31 paragraphs. No list-items, verse,
footnotes, tables, blockquotes, or bylines.

## Method

- **Library:** PyMuPDF (`pymupdf`); `page.get_text("dict")`. No `pdfplumber`
  needed.
- **Heuristics fired:**
  - Heading detection: font size ≥ 13 on first page, title-word match
    (`"DRUNK"`).
  - Running headers dropped at `y0 < 50` AND (`size <= 9.5` OR digit-only).
    Confirmed: per page 410..417 each has a 12pt page-number line (`399`, `400`,
    etc.) at y≈37.24 and a 9pt running-title line at y≈39.94 — both dropped.
  - Bottom-page-number drop: page 409's `398` at y=540.74 size=9pt — dropped
    by the y>500 + digit-only rule.
  - Story-number `(15)` at y=79 on page 409 — dropped as structural numbering.
  - Italic subtitle detection (`"Italic"` in font, size < 11.5, y < 170).
  - Drop-cap detection: `font == "ParkAvenue"` and `size > 40`. Single drop-cap
    `U` at y=171.13, size 51.65 on page 409.
  - Body-margin alternation: odd pages (409, 411, 413, 415, 417) ≈ 69.28;
    even pages (410, 412, 414, 416) ≈ 52.28. Paragraph-start indent threshold
    = body margin + 8.
  - Drop-cap wrap window: lines with `y0 < dropcap_y + 45` and `x0 > body_margin + 15`
    on page 409 are treated as continuation of the drop-cap's first paragraph.
  - Cross-line hyphenation with Wave 6 allowlist (prose prefixes + number
    prefixes + `pseudo-` + ordinal-decades, plus number-prefix qualification
    against known compound tails).
  - Capitalized-stem hyphen preservation (Wave 6 rule) — did not fire here.
  - Em-dash line-join: no space inserted after line-end `—` (Wave 5 rule).
  - Multi-hyphen compound preservation (`-[A-Za-z]+-$`) — fired once for
    `ten-year-old` (p018, cross-line split at `ten-year-` + `old` on page 413).

## Schema decisions

- **`parentGroup`:** `personal-stories/they-stopped-in-time` (matches metadata
  and matches the-missing-link / other Wave 6/7 They-Stopped-in-Time stories).
- **Story-number `(15)`:** dropped per conventions (structural numbering, not
  authored content).
- **Heading text:** `"A DRUNK, LIKE YOU"` — visual all-caps rendering with
  comma preserved. Section metadata `title` is prose-case `"A Drunk, Like You"`;
  the divergence is intentional per Wave 1B conventions.
- **Subtitle (`p002`):** single paragraph. Italic deck is two lines:
  - Line 1 x=93.28 (indent), `"The more he listened at meetings, the more he came"`
  - Line 2 x=81.27 (continuation), `"to know about his own drinking history."`
  One indent group → one paragraph (Wave 3 rule).
- **Drop-cap merge (`p003`):** `U` (ParkAvenue 51.65) + first body fragment
  `sually our stories start out by telling what` (NewCaledonia-SC) merged to
  `Usually our stories start out by telling what`. No small-caps lowercase-`i`
  standalone tokens appeared in the SC tail here, so the targeted `\bi\b → I`
  regex is a no-op — kept for safety (convention).
- **Multi-hyphen compound `ten-year-old`:** split across lines on page 413
  (`ten-year-` at y=258.67 ends line, `old` at y=273.27 begins next). The
  Wave 5 "multi-hyphen preservation" rule (out-buffer already ends in
  `-word-$`) correctly preserved the final hyphen → `ten-year-old`.
- **`ninety-day`:** `ninety-` + `day` preserved per number-prefix allowlist
  qualified with the `day` compound-tail. Two instances (p021, p024).
- **`15 1⁄2 years`:** rendered intact on a single PyMuPDF line at body size
  (12pt) — no superscript-fraction fold was needed. The `⁄` (U+2044 FRACTION
  SLASH) is preserved.
- **Italic mid-paragraph (movie titles, TV-show titles):**
  - p012: `The Lost Weekend, Days of Wine and Roses` — italic title partly
    picked up (PyMuPDF tagged the `Wine and Roses` span as Italic). Kept
    inline in the paragraph per conventions (italics alone is a weak split
    signal).
  - p013: `M.A.S.H. night`, `Tuesday Night at the Movies` — italic TV/series
    names. Kept inline.
- **Meeting slogans in p014:** `"Live and Let Live,"` `"Easy Does It,"`
  `"One Day at a Time,"` `"use the Serenity Prayer,"` `"talk to your sponsor,"`
  are quoted dialogue fragments inside the paragraph — kept inline per
  conventions (curly quotes + in-line with surrounding prose is not a split
  signal).
- **No byline:** story ends at page 417 y=506.94 with `"program in the book."`
  No author sign-off line follows. Probe confirmed.

## Flagged blocks

- **`story-a-drunk-like-you-p018`** — contains the `ten-year-old` compound at
  the cross-line split. Output is `"not as a ten-year-old. At that First Step
  table..."` — correct. Flagging because this is the Wave 5 multi-hyphen
  preservation rule firing in a story context; worth double-checking in the
  wave review.
- **`story-a-drunk-like-you-p022`** — `"I was cut back—fired. I thought I was
  fire-proof."` The line break in source was `cut` / `back—fired` (no hyphen
  before the break), so the join inserted a normal space: `cut back—fired`.
  Book reads `cut back—fired` as two words with em-dash, so this is correct.
  Flagging because the prior-line `cutback` (one word) suggested a visual
  parallelism, but the authored text uses the two-word form in the second
  occurrence.

## Schema proposals

- None. All Wave 5/6 accepted rules applied cleanly. The cross-page paragraph
  merges all followed the "body-margin-continuation vs. indent-restart" test
  without ambiguity.

## Uncertainties

- None structural. All 32 blocks decided unambiguously from the typographic
  signals.
