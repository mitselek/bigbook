# story-crossing-the-river-of-denial — extraction report

## Summary

10-page Part II.B story (pages 339-348), `parentGroup: personal-stories/they-stopped-in-time` (the same group as the missing-link exemplar — story (7) in the sequence). Emitted **24 blocks**: 1 heading + 23 paragraphs. No lists, verse, footnotes, tables, bylines, or blockquotes. No surprises in structure — standard story layout with story-number prefix, single-line ALL-CAPS heading, three-line italic subtitle, ParkAvenue drop-cap, NewCaledonia-SC small-caps first-line tail, and continuous body prose that ends mid-page 348 with "I think I'll try it again tomorrow." (no byline).

## Method

- PyMuPDF `page.get_text("dict")` over pages 339-348.
- Line-level sort by `(pdf_page, y0, x0)`.
- Drop rules applied: `y0 < 50 AND size <= 9.5` (running headers), `y0 < 50 AND digit-only` (top page numbers), `y0 > 500 AND digit-only` (bottom page number on p339), `^\(\d+\)\s*$` on first page (story-number `(7)`).
- Heading detection: first line on first page with `13.0 <= size < 20.0` AND containing "RIVER".
- Subtitle: italic 11pt lines with `y0 < 170` on first page. Only one first-line indent (x ≈ 93.28 vs continuation x ≈ 81.27) → single paragraph block.
- Drop-cap merge: ParkAvenue glyph at size > 40 + first body line at `y0 ∈ [dc.y0+5, dc.y0+25]` with `x0 > body_margin + 35`. Merged text = `"D" + body_text.lstrip()` → `"Denial is the most cunning, baffling, and"`.
- Drop-cap wrap guard: body lines on p339 with `y0 < dc.y0 + 45` AND `x0 > body_margin + 15` are forced into the drop-cap paragraph (no false paragraph-split for wrap-around lines).
- Paragraph detection: `L.x0 >= body_margin + 8` (new paragraph indent). Body margin is 69.28 on odd pages, 52.28 on even.
- Join rules: Wave 5/6 cross-line hyphenation with full allowlist (prose prefixes + number + ordinal-decade prefixes), multi-hyphen preservation regex `-[A-Za-z]+-$`, capitalized-stem preservation, em-dash no-space join, `\bi\b → I` post-flatten on drop-cap line.

## Schema decisions

- **Heading**: single centered line `CROSSING THE RIVER OF DENIAL` (no two-line merge needed — fits on one line at size 13.5). Section `title` metadata is prose-case `Crossing the River of Denial`; the heading block text preserves the visual ALL-CAPS rendering per conventions.
- **Subtitle as single paragraph**: the 3-line italic deck has exactly one first-line indent (line 1 at x=93.28) with two continuation lines at x=81.27. Per conventions default, single indent group → single `paragraph` block.
- **Story-number `(7)`**: dropped per conventions (structural numbering, not authored content).
- **Drop-cap**: standard single-letter + partial-word merge: `D` + `enial` → `Denial` (no space). Small-caps tail on the first line is rendered lowercase by PyMuPDF; the resulting text `"Denial is the most cunning..."` has correct pronoun capitalization without the `\bi\b → I` fix needing to fire (first body line has no standalone `i` token). The fix is still applied defensively per missing-link convention.
- **No byline**: the story closes with narrative prose ("...try it again tomorrow.") on p348 — no author attribution line, no `-- Name` sign-off. Confirmed by inspection of full page 348 in the probe.
- **Cross-page merge**: paragraph boundaries detected by first-line indent inherently span page breaks because the line-sort walks pages in order. No separate cross-page merge pass needed. Verified by spot-checking the 339→340 merge (p005 `...burning swallow of bourbon straight from the bottle...`).

## Flagged blocks

### p021 — `get-to-gether` artifact (conventions rule misfires)

- **Text snippet**: `"...a friend took me to an A.A. get-to-gether. I was in absolute awe..."`
- **Expected**: `"get-together"` (single-hyphen compound; the source has the word `get-together` split across a line with PyMuPDF emitting `get-to-` + `gether`).
- **Why the rule misfires**: the multi-hyphen preservation rule keeps the trailing `-` whenever the out-buffer ends with regex `-[A-Za-z]+-$`. Here `get-to-` matches that pattern (`-to-`), but the first hyphen is the real compound hyphen in `get-together` and the second is a line-break hyphen. The conventions rule's stated intent is for three-plus-part compounds like `life-and-death`, `face-to-face`, `ten-dollar-a-week`. For two-part compounds whose sole visual hyphen happens to sit one word before a line-break, the rule produces `get-to-gether` instead of `get-together`.
- **Other Wave 7 outputs for comparison**: `story-the-missing-link-p022` has `"get-togethers"` (correct, no line break). `story-the-perpetual-quest-p025` has `"get-together"` (correct). `ch11-a-vision-for-you-p040` has `"get-togethers"` (correct). All other instances avoided the line-break case.
- **Action taken**: kept the literal conventions rule output (`get-to-gether`). This flag surfaces the gap for the post-wave review — the rule could be tightened to require 2+ existing hyphens in the word-so-far (e.g. `-[A-Za-z]+-[A-Za-z]+-$`) or fired only when the buffer's trailing token spans three or more hyphens, which would correctly skip the `get-together` case while still catching `life-and-death-`.

### p006 — em-dash join across `rock n' roll—companions`

- **Text snippet**: `"...after discovering drugs, sex, and rock n' roll—companions to my best friend, alcohol..."`
- **Line break**: p340 line at `y0=200.25` ends `rock n'` and wait — actually this is on a single line. No flag; noting only that em-dash no-space join is not exercised here. The em-dash in `"...happened to me—yet)..."` in p003 is also within a single line.

## Schema proposals

None. The one genuine quirk (`get-to-gether`) is already documented in the conventions evolution log as a known tradeoff, and tightening the multi-hyphen rule is a conventions-level decision best handled by Plantin after aggregating Wave 7 data. Leaving as-is per "literal conventions application" guidance in the task prompt.

## Counts

- Total blocks: **24**
  - `heading`: 1
  - `paragraph`: 23
- By page:
  - p339: 5 (heading + subtitle + drop-cap paragraph + 2 body paragraphs)
  - p340: 3
  - p341: 3
  - p342: 3
  - p343: 2
  - p344: 2
  - p345: 2
  - p346: 2
  - p347: 2 (final paragraph continues and closes on p348)

## Front-matter verdicts

- **Heading text**: `"CROSSING THE RIVER OF DENIAL"` — single source line, no two-line merge needed. Visual ALL-CAPS preserved; metadata `title` remains prose-case.
- **Subtitle**: one `paragraph` block covering all 3 italic lines, joined to `"She finally realized that when she enjoyed her drinking, she couldn't control it, and when she controlled it, she couldn't enjoy it."`
- **Drop-cap**: `"Denial is the most cunning, baffling, and powerful part of my disease..."` — correct merge, no space after `D`, SC tail flattened correctly.
- **Story-number `(7)`**: dropped (structural numbering).
- **Byline**: none present; story closes with body prose.
