# story-another-chance — extraction report

## Summary

Extracted the 4-page story "Another Chance" (pages 537-540), Part III / They Lost
Nearly All, story number (12). This is the shortest story in the book. Emitted
**16 blocks**: 1 heading + 15 paragraphs (including the italic-deck subtitle as a
single paragraph). No list-items, no verses, no footnotes, no tables, no byline.
Story closes on p540 with "...we are able to stay sober." — no sign-off.

The main surprise in this section was that **body-margin parity is REVERSED**
from other Wave 7 stories (e.g. acceptance, winner-takes-all). In those stories,
odd pages had left-margin ~69.28 and even pages ~52.28. In Another Chance,
pages 537 and 539 (odd) have margin ~52.28 and pages 538 and 540 (even) have
~69.28 — the opposite. Handled via per-page mode-based auto-detection rather
than a fixed parity rule.

## Method

- **PyMuPDF `page.get_text("dict")`** as the primary extractor (no pdfplumber used).
- Probe: `.tmp/probe-story-another-chance.py` dumped 138 line-records across 4 pages.
- Extraction script: `.tmp/extract-story-another-chance.py` applies the full
  Wave 7 rule set:
  - Ligature normalization (`fi`, `fl`, etc.), NUL-byte stripping, soft-hyphen stripping.
  - Running-header drop: `y<50 AND (size<=9.5 OR text.isdigit())`.
  - Bottom page-number drop: `text.isdigit() AND y>500`.
  - Story-number `(12)` drop on the first page.
  - Heading detection: `size>=13 AND title-word match`.
  - Subtitle detection: italic, ~11pt, `y<180` on first page.
  - Drop-cap detection: `font=="ParkAvenue" AND size>40`.
  - Paragraph splitting via first-line indent past auto-detected body margin.
  - Cross-line hyphenation with Wave 7 allowlist + capitalized-stem proper-noun
    allowlist + number-prefix qualification + tightened multi-hyphen rule.
  - Em-dash bidirectional no-space-join.
  - Cross-page paragraph merge (right-margin carry-over heuristic).
- Heuristics that fired in this section:
  - 1 cross-page hyphen-join: `treat-` (p538 last line) + `ment` (p539 first line)
    → `treatment` (not in the compound allowlist; stripped per rule).
  - 3 cross-page paragraph merges: p537→p538 (inside p006, joining
    `"meet-"/"ing."` across the page break), p538→p539 (inside p010, joining
    `"treat-"/"ment"`), p539→p540 (inside p013, joining
    `"friends than"/"I ever had"`).
  - 1 drop-cap + first-body merge on p537: drop-cap `I` + body `"am an african-..."`
    → `"I am an african-..."` (single-letter + separate word, space inserted per
    Wave 2 rule).
- **Auto-detected body margins** per page (rounded to nearest 0.5pt):
  - 537: 52.5, 538: 69.5, 539: 52.5, 540: 69.5. This is the reverse of the
    odd=69 / even=52 convention documented for earlier stories. Kept the
    auto-detection approach rather than hardcoding a reversed parity in case
    other Part III stories also show variation.

## Schema decisions

- **Story-number `(12)`** dropped (not emitted). Conventions lean toward
  dropping structural numbering.
- **Heading** emitted as visual rendering: `"ANOTHER CHANCE"`. Section metadata
  `title` stays `"Another Chance"` (prose-case).
- **Subtitle** ("Poor, black, totally ruled by alcohol...") emitted as a single
  paragraph block. The italic deck has one first-line indent at x=76.28 with
  two continuation lines at x=64.27 — single indent group → single paragraph
  per the default rule.
- **Drop-cap merge**: `I` + `am an african-american alcoholic...` → `I am an
  african-american alcoholic...`. The drop-cap `I` is a standalone
  single-letter WORD (the pronoun) followed by a complete separate word
  `"am"`, not the first letter of a continued word (which would be no-space).
  Inserted a space per the Wave 2 rule.
- **Small-caps flattening of `"african-american"`**: the first body line on p537
  is in `NewCaledonia-SC` which renders proper case as lowercase. The flatten
  produces `"african-american"` where the source visually shows
  `"African-American"`. Per conventions we flatten small-caps and do NOT
  re-capitalize proper nouns (outside the rule scope). Left as lowercase.
  Flagged below.
- **No byline** — the story ends with a regular-prose final sentence, not a
  sign-off, author attribution, or closing dash-name. Nothing to emit.

## Flagged blocks

- `story-another-chance-p003` — `"I am an african-american alcoholic..."`.
  The `"african-american"` is lowercase because the source line is set in
  small-caps (`NewCaledonia-SC`), which we flatten to lowercase per convention.
  The visually-correct form would be `"African-American"`. Later occurrences
  on p540 (`"African-Americans"`) are set in regular case and extract correctly.
  If downstream normalization wants to title-case small-caps proper nouns, it
  would need to fix this one specifically.

- `story-another-chance-p009` — `"...so I turned to wine. Finally I got so
  lowdown..."`. Source has `"so low-"` / `"down"` across a line break. The
  `low-` prefix is NOT in the conventions compound-prefix allowlist, so the
  hyphen was stripped per rule → `"lowdown"`. The visually-correct reading
  is `"low-down"` (adjective meaning contemptible). This is the same
  deferred class as Wave 6's `pay-`/`fast-`/`witch-` prefixes — requires a
  lexical dictionary or per-section allowlist to resolve. Documented, not
  fixed per section scope.

## Schema proposals

None. All Wave 5-7 rules applied cleanly. The reversed body-margin parity
in this section suggests future sections may also vary; the per-page
auto-detection approach (mode of leftmost-x across 12pt body lines) is a
robust workaround and could be documented as a recommended default in the
conventions.

## Hard constraints honored

- Wrote only to `data/extractions/structured/story-another-chance.{json,md}`
  and `.tmp/` (probe + extraction scripts).
- No source-code modifications.
- No commits, no pushes.
- JSON parses (`json.load` successful; 16 blocks).
