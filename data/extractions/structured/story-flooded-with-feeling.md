# story-flooded-with-feeling — extraction report

## Summary

Structured extraction of "Flooded with Feeling" (PDF pages 380–385, 1-indexed).
Story in Part II.B / **They Stopped in Time**, same `parentGroup` as
the Wave 7 Missing Link extraction (`personal-stories/they-stopped-in-time`).
Story-number `(11)` on the opener confirms its position in the sub-group.

Emitted 26 blocks: 1 heading + 25 paragraphs. No list-items, verse, footnotes,
tables, blockquotes, or bylines.

## Method

- **Library:** PyMuPDF (`pymupdf`); `page.get_text("dict")`. No `pdfplumber` needed.
- **Heuristics fired:**
  - Heading detection: font size ≥ 13 on first page, title-word match (`"FLOODED"`).
  - Running headers dropped at `y0 < 50` AND (`size <= 9.5` OR digit-only).
  - Bottom page-number drop (page 380's `369` at y=540.74, size=9) by digit+y>500.
  - Top page-number drop (pages 381–385 digits at y=37.24 size=12) by y<50+digit
    (Wave 5 12pt-digit rule).
  - Story-number `(11)` at y=79 on first page dropped as structural numbering.
  - Italic subtitle detection (`"Italic"` in font, size < 11.5, y < 165).
  - Drop-cap detection: `font == "ParkAvenue"` and `size > 40`.
  - Body-margin alternation: even pages 52.28, odd pages 69.28; paragraph indent
    threshold = body margin + 8.
  - Drop-cap wrap-window: lines with `y0 < dropcap_y + 45` and `x0 > body_margin + 15`
    on page 380 are treated as continuation of the drop-cap's first paragraph.
  - Cross-line hyphenation with Wave 6 allowlist (prose + small-number + ordinal-
    decade prefixes, capitalized-stem preservation, multi-hyphen preservation).
  - Em-dash line-join: no space inserted after line-end `—` (Wave 5 rule). Fired
    3 times: `"as far—yet"` (p003), `"science fiction—I could"` (p008),
    `"or bad—just a little"` (p012).
  - Multi-hyphen compound preservation: not triggered.
  - Capitalized-stem hyphen preservation: not triggered.

## Schema decisions

- **`parentGroup`:** emitted as `personal-stories/they-stopped-in-time`. This
  story (`(11)` numbering) is the eleventh in the "They Stopped in Time"
  sub-group, matching the Wave 7 conventions established for Missing Link.
- **Story-number `(11)`:** dropped per conventions (structural numbering, not
  authored content).
- **Heading text:** `"FLOODED WITH FEELING"` — visual rendering (all caps).
  Section metadata `title` stays prose-case `"Flooded with Feeling"`, divergence
  intentional per Wave 1B conventions evolution.
- **Subtitle (`p002`):** single paragraph. The italic deck is two lines — first
  at x=76.28 (indented), continuation at x=64.27. One indent group → one
  paragraph (Wave 3 rule).
- **Drop-cap merge (`p003`):** `W` (ParkAvenue 51.65 at y=168.85) + first body
  fragment `hen i first came to A.A., I thought every-` merged to
  `When I first came to A.A., I thought every-` (no space between W and hen).
  - Targeted `\bi\b → I` applied to the merged first-line text. The SC span
    renders the opening pronoun as lowercase `i`; the Wave 6 conventions rule
    (originally surfaced by Missing Link) fires here cleanly. Without it, p003
    would start `"When i first came..."` which is plainly wrong.
- **Cross-page paragraph merges:** 4 paragraphs span page boundaries cleanly.
  - `p007` (p380 last line → p381 first 2 lines) — page 380's final visible
    line was `"A"` continuing to p381's `"friend just missed being shot..."`
    — but structurally this was the tail of `p006`. The actual p380→p381
    paragraph-spanning case is the drinking paragraph that ends mid-sentence on
    p380 and continues on p381.
  - `p010` (p381 → p382): `"...The depression"` → `"became so bad..."`
  - `p023`/`p024` on p384 flow normally within page.
  - `p024` (p384 → p385): `"More than eleven years later it's hard to recapture"` →
    `"the feelings of that night..."` — continues without indent at x=69.28 on
    p385 (body margin for odd page), so merged correctly.
  - `p025` on p385: contains the line `"When I wake up today, there are lots of
    possibilities. I can"` at x=69.28 (not indented past threshold). This is a
    continuation of the same paragraph started at y=156.44 — the previous line
    ends with `"...another day of life."` but the following line does not
    indent, so the paragraph-boundary heuristic keeps them joined. Verified by
    reading the source layout: p385 has exactly two paragraphs — a long one
    followed by the one-line closing `"I keep coming back because it works."`
    (p026) which DOES indent to x=81.28.
- **Dialogue / quoted passages:** kept inline within `paragraph` blocks.
  - p011: `"I believe it's worth the risk."` kept inline.
  - p013: `"And I went on drinking for ten more years."` kept inline.
  - p014: `"Once a week?"` kept inline.
  - p018: `"research."` kept inline.
  - p020: `"Isn't it about time you made a decision?"` kept inline.
  - p021: the quoted Big Book excerpt `"No one among us has been able to
    maintain anything like perfect adherence to these principles."` kept inline
    (per conventions — italic/quoted pull-quotes are not `blockquote`).
- **No byline:** story ends on page 385 with the short closing paragraph
  `"I keep coming back because it works."` — no author sign-off follows.
  Verified the only lines below that are the next page's running header/footer.
- **No list-items, no verse, no footnotes, no tables, no blockquotes.**

## Flagged blocks

- **`story-flooded-with-feeling-p003`** — drop-cap-plus-SC-tail merge with the
  Wave 6 `\bi\b → I` fix. Output opens `"When I first came to A.A., I thought
  everyone had drunk more than I had..."`. Straight re-use of the Missing Link
  precedent; no new decision required.
- **`story-flooded-with-feeling-p025`** — this paragraph contains what could
  *look* like a paragraph break at p385 y=287.88 (`"When I wake up today..."`)
  because the preceding line ends with `.` — but the line begins at x=69.28
  (body margin, no indent), so the paragraph-start rule correctly keeps the
  lines joined. Result matches the source typography: one long paragraph about
  the change in outlook, followed by the single-line indented closing paragraph.

## Schema proposals

- **None.** All Wave 5/6 accepted rules applied cleanly. The Wave 6 pronoun-`I`
  SC rule is the only non-trivial decision, and it's already canonical.

## Uncertainties

- None structural. p025's cross-indent-boundary non-break (a period-terminated
  line followed by a non-indented line on the same page) was audited against
  the source layout and the extraction matches.
