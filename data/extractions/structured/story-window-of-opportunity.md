# story-window-of-opportunity — extraction report

## Summary

Extracted `story-window-of-opportunity` (PDF pages 432..442, the 17th and last
story in Part II.B "They Stopped In Time"). Emitted **36 blocks**: 1 `heading`
+ 35 `paragraph`. No `list-item`, `verse`, `footnote`, `table`, `byline`, or
`blockquote` blocks — this story is straight narrative prose from first page
to last. The author closes with "...for that I am eternally grateful." and
the text ends there (no sign-off / byline).

No uncommon structural surprises. All Wave 5–6 rules applied as specified.

## Method

- PyMuPDF `page.get_text("dict")` → per-line spans with font, size, bbox.
- Single-pass line extraction across PDF pages 432..442 (0-indexed 431..441).
- Per-line filters at extraction time:
  - Drop lines with `y0 < 50 AND size <= 9.5` (running headers).
  - Drop lines with `y0 < 50 AND text.isdigit()` (12pt running page numbers —
    Wave 5 rule).
  - Drop lines with `y0 > 500 AND text.isdigit()` (bottom-of-page numeric
    artifacts — page 432 has `"421"` at y≈540).
  - Drop the story-number `"(17)"` line on the first page.
- First-page structural detection:
  - Heading by `size >= 13.0 AND text contains WINDOW AND OPPORTUNITY`.
  - Subtitle by `font contains "Italic" AND size < 11.5 AND y0 < 165`.
  - Drop-cap by `font == "ParkAvenue" AND size > 40`.
- Drop-cap merge:
  - The drop-cap glyph is `"I"` (standalone single-letter word).
  - The first body text chunk starts with `"got sober while I was still in
    college. Once,"` (NewCaledonia-SC first span).
  - Per Wave 2 stories-specific rule, when a drop-cap is a standalone
    single-letter word followed by a separate word, **insert a space** before
    the body — emitted text: `"I got sober while I was still in college..."`.
  - `\bi\b → I` regex still applied to the merged first-line text (no-op here
    because no lowercase standalone `i` appears; kept for safety per
    missing-link precedent).
- Body prose:
  - Even-page body margin ≈ 52.28, paragraph indent ≈ 64.28.
  - Odd-page body margin ≈ 69.28, paragraph indent ≈ 81.28.
  - Paragraph boundary = line whose `x0 >= body_margin + 8`, except when the
    line is within the drop-cap wrap zone (y < drop-cap y + 45, x > body
    margin + 15) — such lines continue the drop-cap paragraph.
- Cross-line hyphen join logic:
  - Em-dash at line-end: no space inserted (Wave 5 rule).
  - Multi-hyphen-compound preservation: if out-buffer ends with
    `-<word>-$`, keep the trailing hyphen (Wave 5 rule). Did not fire in this
    section.
  - Capitalized-stem preservation: stem starting with uppercase keeps the
    hyphen (Wave 6 rule). Did not fire in this section.
  - Prefix allowlist: `self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`,
    `multi-`, `so-`, `pseudo-` + number prefixes `one-`..`ten-` and
    `twenty-`..`ninety-`.
  - Number-prefix qualification (Wave 6): preserve only when the next token's
    leading alphabetic-only prefix is in the tail allowlist.

## Schema decisions

### Story-number `(17)`

Dropped per conventions (structural numbering, not authored content). The
heading block text is the plain heading `"WINDOW OF OPPORTUNITY"`.

### Subtitle

The italic deck is two lines: `"This young alcoholic stepped out a
second-story"` (x=76.28, first-line indented) and `"window and into A.A."`
(x=64.27, continuation). **Single indent group → one `paragraph` block**, per
the conventions default for subtitles.

### Drop-cap

Single-letter word `"I"` followed by a separate body word `"got"` — inserted
a space: `"I got sober while I was still in college..."`. This matches the
Wave 2 stories rule and is analogous to (but different from) the
missing-link pattern where `"W"` + `"hen"` merged without space.

The SC span for the first body line renders `"got sober while I was still in
college. Once,"` — the `"I"` pronoun is already uppercase in the span output
and needed no `\bi\b → I` fix, but the regex is still applied to the merged
line defensively (consistent with missing-link).

### Cross-line hyphen — number-prefix tail extension

Source page 441 splits `"thirty-"` / `"three"` at a line break. Per Wave 6's
number-prefix qualification rule, `thirty-` is an allowlisted prefix and
keeps the hyphen **only when the next word matches a known tail** (the
original tail allowlist was `half / third / quarter / fold / year / day /
sided / degree / dollar / bit`). `"three"` was not in that set, so the
default behavior stripped the hyphen → `"thirtythree"`, which is
typographically wrong. English hyphenates compound cardinal numbers twenty
through ninety-nine (`thirty-three`, `forty-seven`, …) by rule.

**Decision for this section:** extended `NUMBER_TAILS` locally with the
cardinal number words `one, two, three, four, five, six, seven, eight, nine`
so that `thirty- + three → thirty-three` is preserved. This is consistent
with the `twenty- + third → twenty-third` example already cited in
conventions. See **Schema proposals** below.

### Cross-line hyphen — `year` tail bugfix

Source page 432→433 splits `"six-"` / `"year-old."` at a line break. Initial
implementation matched `year-old.` as the "next word" and stripped non-alpha
characters to `"yearold"` (which is NOT in NUMBER_TAILS) → emitted
`"sixyear-old"`. Fixed by extracting only the leading alpha-only run of the
next token (so `"year-old."` → `"year"`, which IS in NUMBER_TAILS). This
correctly preserves `"six-year-old"` and `"five-year-old"` (p036, not
cross-line split but identical pattern on a single line). See **Schema
proposals** below.

## Flagged blocks

None with semantic uncertainty. Full pass on the output JSON for common
broken-join patterns (classic hyphenated-compound shapes like
`self-centered`, `second-story`, `six-year-old`, `well-dressed`,
`thirty-three`, `forty-five`, `five-year-old`) confirmed every one is
correctly hyphenated; no broken joins found.

Two worth a quick note:

- `story-window-of-opportunity-p012` (pp 434–435) — long paragraph (16
  source lines) with two mid-paragraph single-sentence thoughts. No indented
  new-paragraph signal between them, so kept as one block. Matches source
  visual layout.
- `story-window-of-opportunity-p036` (p442) — final paragraph closes with
  `"...for that I am eternally grateful."`, no byline / sign-off follows.

## Schema proposals

### Extend `NUMBER_TAILS` to include cardinal number words

**Proposal:** add `one, two, three, four, five, six, seven, eight, nine` to
`NUMBER_TAILS` so decade-prefix + cardinal combinations like `thirty-three`,
`forty-seven`, `seventy-two` preserve the hyphen across a line break.

**Evidence (this section):** `thirty- + three` at the line-break between
pp441 (y=448.52 → 463.12). Without the extension the default strips to
`thirtythree`; with the extension the compound is preserved.

**Risk assessment:** low. A cross-line break where the preceding line ends
with e.g. `three-` and the next line starts with `one` is not a common
English pattern; the specific cross-line trigger is `<decade-prefix>- +
<cardinal-word>`. A false-positive would require a line ending in e.g.
`three-` where "three" is followed by `one/two/…` as an unrelated separate
word — I cannot think of a construction where that would happen at a line
boundary in body prose.

**Symmetry argument:** the existing tails include ordinal number tails
(`third`, `quarter`, `half`) to cover fractions; adding cardinal tails
covers compound cardinals. The pair is a natural cohort.

### Bugfix for `NUMBER_TAILS` lookup

**Proposal:** when qualifying a number-prefix cross-line join, extract the
**leading alpha-only prefix** of the next token — not `re.sub(r"[^A-Za-z]",
"", token)`. The latter glues tail words across internal hyphens or
punctuation (`year-old.` → `yearold`) and misses legitimate tails.

**Evidence (this section):** `six- + year-old.` failed to match `year`
under the old "strip all non-alpha" rule. Switched to `re.match(r"[A-Za-z]+",
next_token)` and `"six-year-old"` is preserved.

**Symmetry argument:** the compound-prefix allowlist is a prefix test (the
stem before the hyphen). The tail test should be a prefix test too (the
first alphabetic run of the continuation). Consistency.

## Hard constraints

- Wrote only `data/extractions/structured/story-window-of-opportunity.json`
  and this `.md` report.
- Used `.tmp/probe-window-of-opportunity.{py,txt}` and
  `.tmp/extract-story-window-of-opportunity.py` — all under `.tmp/`.
- No source-code modifications.
- No commits, no pushes.
- JSON parses and conforms to the extended `BookSection` schema.
