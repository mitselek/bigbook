# story-a-late-start — extraction report

## Summary

Structured extraction of "A Late Start" (PDF pages 541–549, 1-indexed). Story #13 of
Part III / **They Lost Nearly All** — `parentGroup` = `personal-stories/they-lost-nearly-all`.

Emitted **21 blocks**: 1 heading + 20 paragraphs. No list-items, verse, footnotes,
tables, blockquotes, or bylines.

## Method

- **Library:** PyMuPDF (`pymupdf`); `page.get_text("dict")`. No `pdfplumber` needed.
- **Heuristics fired:**
  - Heading detection: font size ≥ 13 on first page, title-word match (`"LATE"`).
  - Running headers dropped at `y0 < 50` AND `size <= 9.5`.
  - Top/bottom page-number drop: `y0 < 50` OR `y0 > 500` with digit-only text.
  - Story-number `(13)` at y=79 size=12.5 dropped as structural numbering.
  - Italic subtitle detection (`"Italic"` in font, size < 11.5, y < 170).
  - Drop-cap detection: `font == "ParkAvenue"` AND `size > 40`.
  - **Reversed body-margin mapping:** odd pages 52.28, even pages 69.28. This is
    the REVERSE of recent Wave 7/8 scripts (e.g. acceptance-was-the-answer, which
    maps odd→69.28, even→52.28). Reason: "A Late Start" starts on an ODD PDF page
    (541) where the first body text (after drop-cap) sits at x=52.28; acceptance
    starts on an EVEN page (418) with the same x=52.28 on the first body text.
    The margin alternates by physical-page-side; which parity gets which offset
    depends on the story's starting page parity.
  - Paragraph indent threshold = body-margin + 8.
  - Narrow-glyph drop-cap wrap-zone: drop-cap `I` (ParkAvenue 51.65 at x=54.73..74.35).
    Wrap-zone y-extent = drop-cap y + 45; x-threshold = body-margin + 15. First two
    body lines (y=196.01, y=210.82 both at x=79.28) fall in the wrap zone; line 3
    onwards at x=52.28 resumes body-margin-aligned layout.
  - Cross-line hyphenation with Wave 7 allowlist (8 prose + 10 small-number +
    8 decade prefixes + narrowed capitalized-stem proper-noun allowlist).
  - Em-dash line-join rules (Wave 5 + Wave 7 bidirectional): no space inserted
    when either side touches `—`.
  - Cross-page paragraph merge via right-margin carry-over heuristic (threshold 280).

## Schema decisions

- **`parentGroup`:** `personal-stories/they-lost-nearly-all`. This is Part III
  of the personal-stories outline ("They Lost Nearly All"). Prior Wave 7/8
  `they-stopped-in-time` stories used `personal-stories/they-stopped-in-time`;
  this is a new Part III group value.
- **Story-number `(13)`:** dropped per conventions (structural numbering, not
  authored content). The story's position as #13 in Part III is outline metadata.
- **Heading text:** `"A LATE START"` — visual rendering (all caps). Section
  metadata `title` is prose-case `"A Late Start"`. Divergence intentional per
  Wave 1B conventions evolution.
- **Subtitle (`p002`):** single paragraph. The italic deck is three lines — first
  at x=76.28 (indented), continuations at x=64.27. One indent group → one paragraph
  per the Wave 3 rule. Source quote: `"It's been ten years since I retired, seven
  years since I joined A.A. Now I can truly say that I am a grateful alcoholic."`
- **Drop-cap merge (`p003`):** `I` (ParkAvenue 51.65) + first body SC line
  `am a seventy-ﬁve-year-old alcoholic. For` → `"I am a seventy-five-year-old
  alcoholic. For"` (single-letter drop-cap + complete following word → insert
  SPACE per conventions). PyMuPDF returned lowercase codepoints in the SC tail
  already; ligatures normalized to `fi`. No standalone `i` in the SC span, so
  the Wave 6 `\bi\b → I` defensive fix was a no-op (applied anyway).
- **No byline:** story ends on page 549 with `"I have accepted the gift of a
  safer, happier journey through life."` No author sign-off line follows.
- **Dialogue / quoted phrases:** kept inline within paragraph blocks (per
  conventions). Examples:
  - p013: `"grateful alcoholic,"` quoted inside prose.
  - p017: dialogue with sponsor — `"Don't you think that you will do the same for
    someone else some day?"` and the reply `"I will never be responsible..."` —
    both stay inline.
  - p020: echoed quote `"never be responsible to or for anyone ever again"` —
    inline.
- **Cross-page paragraph merges (8 merges across 9 pages):** every page boundary
  541→542, 542→543, 543→544, 544→545, 545→546, 546→547, 547→548, 548→549 occurred
  mid-paragraph. The right-margin carry-over heuristic fired cleanly in all cases;
  the last line of each earlier page had x1 > 290 (well past the 280 threshold),
  and the first line of each next page was at body-margin (not indented).

## Flagged blocks

- **`story-a-late-start-p005`** — `so-` false positive (1 of 2). Source split:
  page 542 `"me seem cool and so-"` / `"phisticated."`. The Wave 3 allowlist adds
  `so-` unconditionally (for `so-called`), which would produce `so-phisticated`.
  Applied a **section-specific `so-` tail qualification**: keep the hyphen only
  when the next word is `called`, `so`, or `and`. Otherwise strip. Output:
  `sophisticated` ✓. See Schema proposals.

- **`story-a-late-start-p010`** — `son-in-law` three-part compound split. Source
  split: page 544 `"daughter and son-"` / `"in-law for dinner..."`. Neither
  Wave 5 multi-hyphen nor Wave 7 stricter multi-hyphen rule fires (out-buffer
  ends with single hyphen on `son-`). Applied a **section-specific forward
  hyphen-in-token lookahead**: if the next line's first word is followed by a
  hyphen (`in-law`), preserve the leading-line hyphen. Produces `son-in-law` ✓.
  See Schema proposals.

- **`story-a-late-start-p014`** — `so-` false positive (2 of 2). Source split:
  page 546 `"lady had nineteen years of so-"` / `"briety..."`. Same fix as p005;
  output: `sobriety` ✓.

## Schema proposals

1. **Narrow `so-` tail qualification** (mirrors the Wave 6 number-prefix
   qualification). Motivation: two false positives in this section
   (`so-phisticated`, `so-briety`) from the Wave 3 unconditional `so-` allowlist.
   The only legitimate `so-` compounds in normal English prose are:
   `so-called`, `so-and-so`, `so-so`. Rule: when the out-buffer ends with `so-`,
   keep the hyphen only when the next line's first word (leading alpha run) is
   in `{called, so, and}`. Otherwise strip.

   **Analogy:** Wave 6 added a `NUMBER_TAILS` qualification to the number
   prefixes for the same reason (`nine-` + `teen` false positive). The `so-`
   qualification is structurally identical.

2. **Forward hyphen-in-token lookahead for three-part compounds.** Motivation:
   `son-in-law` split across `son-` / `in-law`. The existing multi-hyphen
   preservation rules (Wave 5 `-\w+-$` and Wave 7 stricter `\w+-\w+-$`) both
   check the out-buffer for prior hyphens; neither handles the case where the
   hyphen compound's first split is at the FIRST hyphen position (so the
   out-buffer has only one hyphen, not two). Rule: when the out-buffer ends with
   `-` AND the next line's first token is itself hyphenated (`word-letter`
   pattern), preserve the line-end hyphen. This catches `son-in-law`,
   `father-in-law`, `mother-in-law`, `brother-in-law`, `sister-in-law`, and any
   other `X-in-law` / `X-Y-Z` pattern without widening the prefix allowlist.

   **Safety:** the rule fires only when the next line starts with a hyphenated
   token — an unusual construction in body prose. False positives would require
   the author to split a non-compound word at one hyphen position while the
   continuation happens to start with another hyphenated word. No such case
   observed in this section's corpus.

## Uncertainties

- None structural. Both section-specific rules (narrow `so-` qualification and
  forward hyphen-in-token lookahead) are documented above and proposed for the
  conventions. Without them, three words would be wrong: `so-phisticated`,
  `so-briety`, `sonin-law`. All three words, after the rules, match the source
  book.

- The cross-page paragraph merge boundary at p548→p549 crosses the `be-` / `hind`
  hyphen split. The merge and strip rules composed cleanly:
  out-buffer after p548 ends with `...what was be-`, next page starts `hind me...`,
  `be-` is not in any allowlist, stripped, joined → `behind`. Verified in
  output p020: `"urged by the dread of what was behind me, I took tiny delicate
  steps onto this new path."`
