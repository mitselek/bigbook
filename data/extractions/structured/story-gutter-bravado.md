# story-gutter-bravado — extraction report

## Summary

Extracted `story-gutter-bravado` (Part III / They Lost Nearly All, story 9), pages 507–517 inclusive. Emitted **26 blocks total**: 1 heading + 25 paragraphs. No lists, verses, footnotes, tables, blockquotes, or bylines — pure narrative-prose story. Drop-cap is the narrow-glyph `I` standalone word. Two residual intra/cross-line hyphen artifacts from the deferred lexical-dictionary class (`expoliceman`, `merrygo-round`); both match known Wave 3 / Wave 7 deferred patterns.

## Method

- **PyMuPDF** `page.get_text("dict")` only. No `pdfplumber` used.
- Single extraction script at `.tmp/extract-story-gutter-bravado.py`.
- Probe script at `.tmp/probe-story-gutter-bravado.py` (output in `.tmp/probe-story-gutter-bravado.txt`).

### Heuristics fired

- **Running-header drop**: combined `y0 < 50 AND (size <= 9.5 OR text.isdigit())`. Dropped 9 running page numbers at y=37.24 size=12pt (would have leaked as bare integers into the body text) plus 9 running titles at y=39.94 size=9pt on pages 508–516. Page 507 has no top-of-page headers (section's first page).
- **Bottom-of-page page number**: "501" on p507 at y=540.74 size=9pt dropped.
- **Story-number `(9)` drop**: y=79 size=12.5 on p507 matched the `^\(\d+\)\s*$` regex — dropped (structural numbering, not authored content).
- **Heading detection**: size≥13 AND text contains `GUTTER`+`BRAVADO`. Matched "GUTTER BRAVADO" at y=102 size=13.5.
- **Subtitle detection**: italic font size≈11 above y≈170 on the first page. Matched 3 lines.
- **Drop-cap detection**: ParkAvenue font size>40 on first page. Matched `I` at y=182.81 (narrow glyph 19.6pt wide).
- **Narrow-glyph drop-cap wrap threshold**: used `+20` past body margin (Wave 7 rule). `I` is narrow — wide-glyph `+35` would have missed the body text at x=79.28.
- **First-line-indent paragraph split**: odd pages body margin 52.28 / paragraph indent ≥60, even pages body margin 69.28 / paragraph indent ≥77.
- **Drop-cap wrap zone**: dc.y0+45 (covers ~two wrap lines at x=79.28 before body returns to x=52.28).
- **Cross-page paragraph merge**: not needed — each source paragraph terminates on its own page (last lines are short, subsequent pages start with indented first-line paragraph starts). PyMuPDF's per-page block split happened to align with paragraph boundaries here.

## Schema decisions

- **Story-number `(9)` drop**: per conventions "lean toward DROP — structural numbering, not authored content". Dropped.
- **Heading text**: emitted as visual ALL-CAPS `GUTTER BRAVADO` (per conventions: `title` metadata is prose-case, `heading` block preserves the source's visual rendering).
- **Subtitle as single paragraph**: three italic lines; only ONE indent group (first line at x=76.28, continuations at x=64.27). Emitted as a single `paragraph` block (conventions default). The subtitle reads: *"Alone and unemployable, he was given two options by the court, get help or go to jail, and his journey toward teachability began."*
- **Drop-cap merge**: `I` is a standalone word (not a partial letter like `W` + `ar`). Merged as `"I " + "was born..."` with a single space. Applied the `\bi\b → I` pronoun-flatten fix as a safety measure (no-op on this first line since the first-body-line text starts with `was`, no lowercase `i`).
- **parentGroup**: set to `personal-stories/they-lost-nearly-all` per the prompt metadata. First section in the Wave 8 run to use this parent group.

## Flagged blocks

### `story-gutter-bravado-p003` — `expoliceman`

Source form is `ex-policeman`. Page 507 line 12 ended with `an ex-`, line 13 started with `policeman`. The `ex-` prefix was intentionally removed from the compound-word allowlist in Wave 3 (chapter-02 agent found 2 false positives — `experiences`, `explanation` — and 0 genuine cross-line compounds in that section). This story has 1 genuine case, produced `expoliceman` in the output.

Current block text snippet: `"Dad was an expoliceman who had put himself through law school..."`

Flagged under the **Wave 7 deferred class** (lexical-dictionary compound hyphens). Not patching in-script because the conventions doc explicitly defers this to a separate post-reassembly dictionary pass.

### `story-gutter-bravado-p015` — `merrygo-round`

Source form is `merry-go-round`. Page 512 line ended with `this merry-`, next line started with `go-round`. `merry-` is not on the allowlist, so the cross-line rule stripped the hyphen. The multi-hyphen preservation rule (Wave 7 tightened) requires ≥2 existing hyphens in the out-buffer BEFORE the trailing hyphen — `this merry-` has zero existing hyphens in the out-buffer, so the rule does not fire.

Current block text snippet: `"I desperately wanted off this merrygo-round, but I had no idea how to do it."`

Same deferred class as above. The Wave 7 tightened rule correctly avoids false positives like `get-to-gether → get-together`; this case just happens to fall outside the tightened rule's scope.

## Schema proposals

None. All conventions applied cleanly. The two flagged artifacts (`expoliceman`, `merrygo-round`) are already covered by the Wave 3 / Wave 7 deferred lexical-dictionary class.

## Miscellany

- **Em-dash handling**: 12 em-dashes in the output, all correctly joined without surrounding spaces (both line-end and line-start variants fire correctly).
- **No cross-page paragraph merge needed** — each PyMuPDF-per-page block aligned with a source-paragraph boundary. Verified by visual inspection: pages 508, 509, 510, etc. all start with a first-line-indent paragraph start.
- **Compound hyphens preserved in body text** (these are all intra-line, not cross-line): `well-to-do`, `hard-working`, `fun-loving`, `happy-go-lucky`, `hand-to-mouth`, `off-season`, `clear-cut`, `double-crossed`, `co-workers`, `twenty-two`, `know-it-all`, `wide-eyed`, `work-related`, `bar-hopping`.
- **Ligatures normalized**: `fi` / `fl` appearances in `first`, `find`, `filled`, `flopping`, `floor`, `fulfilled`, `conflicts`, `confidence`, `confident`, `difficult`, etc.

## Counts

- Blocks total: **26**
- Headings: **1**
- Paragraphs: **25** (including subtitle at p002 and drop-cap-bearing first body paragraph at p003)
- Lists / verses / footnotes / tables / blockquotes / bylines: **0** each
- Pages: 507–517 (11 pages)
