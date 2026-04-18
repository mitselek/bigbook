# story-my-chance-to-live — extraction report

## Summary

Structured extraction of "My Chance to Live" (PDF pages 320-329, 1-indexed). Fifth
story in Part II.B / **They Stopped in Time** (`parentGroup` =
`personal-stories/they-stopped-in-time`, established by Wave 6 `story-the-missing-link`).

Emitted **42 blocks**: 1 heading + 41 paragraphs (1 subtitle paragraph + 40 body
paragraphs). No list-items, verse, footnotes, tables, blockquotes, or bylines.

## Method

- **Library:** PyMuPDF (`pymupdf`); `page.get_text("dict")`. No `pdfplumber` needed.
- **Heuristics fired:**
  - Heading detection: font size >= 13 on first page, title-word match (`"CHANCE"`).
  - Running headers dropped at `y0 < 50` AND (`size <= 9.5` OR digit-only).
  - Bottom page-number drop (page 320's `309` at y=540.74, size=9) by digit+y>500.
  - Story-number `(5)` at y=79 on first page dropped as structural numbering.
  - Italic subtitle detection (`"Italic"` in font, size < 11.5, y < 170).
  - Drop-cap detection: `font == "ParkAvenue"` and `size > 40`.
  - Body-margin alternation: even pages 52.28, odd pages 69.28; paragraph indent
    threshold = body margin + 8.
  - Drop-cap wrap-window: lines with `y0 < dropcap_y + 45` and `x0 > body_margin + 15`
    on page 320 are treated as continuation of the drop-cap's first paragraph
    (absorbs y=182 and y=197 body lines that sit to the right of the tall "I" glyph).
  - Cross-line hyphenation with Wave 6 allowlist (9 prose prefixes + 10 small-number
    + 8 ordinal-decade + capitalized-stem narrow allowlist — see below).
  - Em-dash line-join: no space inserted after line-end `—` (Wave 5 rule).
  - Multi-hyphen compound preservation (`-[A-Za-z]+-$`) — not triggered in this story.
  - `\bi\b → I` safety applied to drop-cap + first-body merge (no standalone `i`
    in the SC span, so no-op here; retained for conformance).

## Schema decisions

- **`parentGroup`:** `personal-stories/they-stopped-in-time`. Pre-established by
  Wave 6 `story-the-missing-link`. Verified against prompt metadata.
- **Story-number `(5)`:** dropped per conventions (structural numbering, not
  authored content). This story's number `(5)` places it fifth in the
  "They Stopped in Time" sub-group.
- **Heading text:** `"MY CHANCE TO LIVE"` — visual rendering (all caps). Section
  metadata `title` is prose-case `"My Chance to Live"`; divergence intentional per
  Wave 1B conventions.
- **Subtitle (`p002`):** single paragraph.
  `"A.A. gave this teenager the tools to climb out of her dark abyss of despair."`
  The italic deck is two lines — first at x=76.28 (indented), continuation at
  x=64.27. One indent group → one paragraph per the Wave 3 default.
- **Drop-cap merge (`p003`):** `I` (ParkAvenue 51.65) as a standalone single-letter
  pronoun word + first body fragment `came through the doors of Alcoholics Anony-`
  → `"I came through the doors of Alcoholics Anonymous..."` (space inserted between
  `I` and `came` per the Wave 2 convention for single-letter-word drop-caps).
  - The first body line's leading span is `NewCaledonia-SC` containing
    `"came through"` — small-caps glyphs map to real lowercase codepoints; flatten
    to regular case is a no-op (the phrase "came through" has no uppercase
    conflict). No standalone `i` in the SC tail, so the `\bi\b → I` safety regex
    is a no-op here (retained for conformance with the missing-link rule).
  - Cross-line join `Anony-` + `mous` at y=182→197 is a mid-sentence break of the
    proper noun "Anonymous" — see the next bullet.
- **No byline:** story ends on page 329 at y=404 with `"lieve A.A. just might work
  for me too."` — no author sign-off follows. Confirmed by probe.
- **Dialogue / inner thoughts kept inline** per conventions:
  - p013: vice principal's speech `"Straighten up, or you are out on your ear.
    For good."` — quoted dialogue inside the paragraph.
  - p017: italic inner voice `See, you failed again. You knew you wouldn't feel
    better...` kept inline (no leading quote, no shared-x verse signals).
  - p019, p024, p026: short narrator inner questions kept inline.
  - p023, p026, p034, p037: quoted asides (`"You're not an alcoholic..."`,
    `"Now you have completed the Steps..."`) stay in their surrounding paragraphs.

## Capitalized-stem hyphen rule — narrow allowlist adopted locally

Wave 6 accepted a rule: "if the string preceding the line-end `-` starts with an
uppercase letter, preserve the hyphen" (e.g. `God-consciousness`). Applied
mechanically, that rule misfired on p003 of this story: `Alcoholics Anony-` + `mous`
→ `Alcoholics Anony-mous` (wrong — should be `Anonymous`). `Anony` is the
left half of a mid-sentence proper noun that happens to be broken by typography,
not a semantic compound stem.

**Decision for this section:** implement the capitalized-stem rule as a narrow
**allowlist** of known ethno-/theo-linguistic compound halves:
`God`, `Anglo`, `Franco`, `Judeo`, `Greco`, `Indo`, `Sino`, `Afro`, `Euro`, `Roman`.
Any other capitalized stem at a line-end `-` gets normal cross-line hyphen
stripping. `Anony-` is not in the allowlist, so `Anony-` + `mous` correctly joins
to `Anonymous`.

**Precedent note:** `story-physician-heal-thyself.json` (p016) contains
`"Alcoholics Anony-mous"` — same construct, left as a hyphen artifact by an
earlier peer agent that applied the general capitalized-stem rule. This may
warrant a retro-fix during the Wave 7/8 consolidation pass.

## Flagged blocks

- **`story-my-chance-to-live-p003`** — drop-cap merge with the narrow
  capitalized-stem allowlist. Text begins
  `"I came through the doors of Alcoholics Anonymous at age seventeen, a walking
  contradiction."` Confirmed clean against book reading.

## Schema proposals

- **Narrow the capitalized-stem hyphen-preservation rule to an allowlist.** The
  general "uppercase stem → keep hyphen" rule (Wave 6, appendix-ii) has false
  positives on mid-sentence proper-noun line breaks (`Anony-mous`, `Green-land`,
  `Wash-ington`, etc. — any capitalized word of sufficient length that spans two
  lines). Propose restricting to the allowlist above (or similar), treating the
  general rule as the exception rather than the default. Rationale: the observed
  genuine compounds (`God-consciousness` in appendix-ii) are a small fixed set;
  the false-positive set is unbounded (any capitalized word).

- **No other proposals.** All other Wave 5-6 accepted rules applied cleanly.

## Uncertainties

- None structural. The capitalized-stem allowlist decision is the only schema
  deviation, documented above.
