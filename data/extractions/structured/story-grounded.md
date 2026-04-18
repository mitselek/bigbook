# story-grounded — extraction report

## Summary

Part III (They Lost Nearly All), story #11 — "Grounded". PDF pages 528-536, 9 pages total. Emitted **31 blocks**: 1 heading + 30 paragraphs. No list-items, no verses, no footnotes, no tables, no bylines, no blockquotes. Clean structural layout — one-column body prose throughout, standard first-line-indent paragraph boundaries, regular cross-page paragraph merges. No facsimile pages. No structural surprises.

## Method

Python script at `.tmp/extract-story-grounded.py` using PyMuPDF (`page.get_text("dict")` only, no pdfplumber).

Applied heuristics (all from Wave 7 conventions):

- Running header/page-number drop: `y0 < 50 AND (size <= 9.5 OR text.isdigit())`; plus bottom-of-page page number `text.isdigit() AND y0 > 500`.
- Story-number `(N)` prefix drop on first page (`^\(\d+\)\s*$`).
- Heading detection by `13.0 <= size < 20.0` plus title-text match.
- Subtitle detection: italic ~11pt on first page above drop-cap (`y0 < 170`). Single indent group → one paragraph block.
- Drop-cap detection: `font == "ParkAvenue" AND size > 40`. First body line located by position (just right of drop-cap glyph, `y0` within +5..+25 of drop-cap `y0`, `x0 > body_margin + 15`).
- Body-margin parity (section-specific): **even pages** (528, 530, 532, 534, 536) `bm=69.28`, **odd pages** (529, 531, 533, 535) `bm=52.28`. Paragraph-indent threshold = `bm + 8`.
- Cross-line hyphenation: full Wave 7 compound-prefix allowlist (prose + number + decade), number-prefix qualification via `NUMBER_TAILS`, Wave 7-narrowed capitalized-stem allowlist (proper-noun set), Wave 7 stricter multi-hyphen preservation regex (`^\w+-\w+-$`), bidirectional em-dash join rule.
- Cross-page paragraph merge: right-margin carry-over heuristic (`x1 > 280pt` on prev block's last line, and next-block first line `x0 < bm + 8`).

## Schema decisions

- **Story-number `(11)` on p528**: dropped entirely (treated as structural numbering per conventions).
- **Heading** emitted as a single `heading` block with text `GROUNDED` (all-caps source rendering preserved). Section `title` metadata remains `"Grounded"` (prose case).
- **Subtitle**: 2 italic lines `Alcohol clipped this pilot's wings until sobriety and / hard work brought him back to the sky.` joined into one `paragraph` block (single indent group — first line at x=93.28, continuation at x=81.27).
- **Drop-cap**: single-letter `I` (ParkAvenue 51.65) at y=176.20, followed by small-caps first line `am an alcoholic. I am part Comanche Indian`. Per the Wave 2 rule for stories (standalone-word drop-cap + separate following word), merged as `"I " + "am an alcoholic..."` with a space. Post-flatten `\bi\b → I` applied to cover small-caps pronoun glyphs that render lowercase after PyMuPDF flattening (in this case it restored the `I` in `I vowed I would never`, `I saw`, etc. within the first paragraph — the drop-cap first line contributed to p003).
- **No byline**: the story closes with `"...find another alcoholic in a meeting of Alcoholics Anonymous."` (p536 y=244.06) and has no sign-off line.
- **Inline U+2044 fractions** `11 1⁄2` (p529) and `3 1⁄2` (p536) — both render as single-line glyphs in the source PDF (no tiny-font denominator separated on its own line), so the Wave 6 superscript-fraction fold is a no-op here. Values pass through as-is.

## Flagged blocks

None uncertain. Several sanity-checked cross-line hyphen joins verified:

- `p004` — `"Four and a half years later I was given an opportunity to go into flight training."` (op-/portunity correctly joined) and `"the eighteen-month period"` (preserved compound).
- `p006` — `"our thirty-fifth anniversary"` (decade-prefix + fraction-tail kept).
- `p009` — `"cross-checking drivers' records"` (cross- preserved; not in allowlist but no line break there — it's on a single line in the source).
- `p015` — `"co-defendants"` (cross-line join from `co-` end of p531 y=506.93 + `defendants...` start of p531 next section; `co-` allowlist fires). `"media-covered three-week trial"` preserved.
- `p020` — `"the air transport pilot license. I studied..."` (cross-line `li-/cense` correctly stripped).
- `p028`, `p025` — `"back-to-work agreement"` preserved (multi-hyphen compound, single-line in source).
- `p031` — `"shame-filled absence"` preserved (on single line in source).

## Schema proposals

None. Wave 7 conventions cover every construct in this story. The section is structurally simple (one-column prose, no lists, no footnotes, no tables, no byline, no drop-cap quirks, no facsimile). Good baseline output.

## Counts

| kind | count |
| --- | --- |
| heading | 1 |
| paragraph | 30 |
| **total** | **31** |

Distribution of blocks by `pdfPage` field (the page where the block's first line sits): p528=5 (h001 heading + p002 subtitle + p003 drop-cap para + p004 + p005), p529=3, p530=4, p531=3, p532=4, p533=3, p534=3, p535=5, p536=1. Total 31. Every page has at least one block; pages 529-536 each start with a paragraph that was merged into the previous-page paragraph (so the `pdfPage` carry-over block counts are the new-paragraph starts per page, not the line-presence count).
