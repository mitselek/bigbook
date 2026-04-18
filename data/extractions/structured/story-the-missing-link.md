# story-the-missing-link — extraction report

## Summary

Structured extraction of "The Missing Link" (PDF pages 292–299, 1-indexed). First
story of Part II.B / **They Stopped in Time** — this is a new `parentGroup` value
(`personal-stories/they-stopped-in-time`) distinct from all prior Wave 4/5 stories
which were in `personal-stories/pioneers-of-aa`.

Emitted 23 blocks: 1 heading + 22 paragraphs. No list-items, verse, footnotes,
tables, blockquotes, or bylines.

## Method

- **Library:** PyMuPDF (`pymupdf`); `page.get_text("dict")`. No `pdfplumber` needed.
- **Heuristics fired:**
  - Heading detection: font size ≥ 13 on first page, title-word match (`"MISSING"`).
  - Running headers dropped at `y0 < 50` AND (`size <= 9.5` OR digit-only).
  - Bottom page-number drop (page 292's `281` at y=540.74, size=9) by digit+y>500.
  - Story-number `(1)` at y=79 on first page dropped as structural numbering.
  - Italic subtitle detection (`"Italic"` in font, size < 11.5, y < 170).
  - Drop-cap detection: `font == "ParkAvenue"` and `size > 40`.
  - Body-margin alternation: even pages 52.28, odd pages 69.28; paragraph indent
    threshold = body margin + 8.
  - Drop-cap wrap-window: lines with `y0 < dropcap_y + 45` and `x0 > body_margin + 15`
    on page 292 are treated as continuation of the drop-cap's first paragraph.
  - Cross-line hyphenation with Wave 3 allowlist (7 prose + 10 small-number prefixes).
  - Em-dash line-join: no space inserted after line-end `—` (Wave 5 rule).
  - Multi-hyphen compound preservation (`-[A-Za-z]+-$`) — not triggered here.

## Schema decisions

- **`parentGroup`:** emitted as `personal-stories/they-stopped-in-time`. This is the
  first structured-extraction output in the "They Stopped in Time" sub-group.
  Prior stories (Bill's Story, Doctor Bob's Nightmare, AA Number Three,
  Gratitude in Action, Women Suffer Too, Our Southern Friend, The Vicious Cycle)
  all emitted `personal-stories/pioneers-of-aa`. Verified against prompt metadata.
- **Story-number `(1)`:** dropped per conventions (structural numbering, not
  authored content). Note: the fact that this story is numbered `(1)` confirms it
  is the first in a new sub-group (per PO's prompt note, story numbering may reset
  at the group boundary).
- **Heading text:** `"THE MISSING LINK"` — visual rendering (all caps). Section
  metadata `title` is prose-case `"The Missing Link"`, divergence intentional per
  Wave 1B conventions evolution.
- **Subtitle (`p002`):** single paragraph. The italic deck is two lines — first at
  x=76.28 (indented), continuation at x=64.27. One indent group → one paragraph
  per the Wave 3 rule (multiple indent groups only when source typography shows
  multiple indent starts).
- **Drop-cap merge (`p003`):** `W` (ParkAvenue 51.65) + first body fragment
  `hen i was eight or nine years old, life sud-` merged to
  `When I was eight or nine years old, life sud-` (no space between W and hen).
  - Targeted small-caps fix: the first body line's leading portion is in
    `NewCaledonia-SC` with codepoints `hen i was`. Per conventions "flatten SC
    tail to regular case" — but the standalone `i` is unambiguously the pronoun
    "I" that the typesetter rendered in small caps. Applied `\bi\b → I` regex
    localized to the merged first-line text **only**. This does not affect the
    rest of the body. Without this fix, p003 would start `"When i was..."` which
    is plainly wrong.
  - Flagging this as a **schema proposal candidate** — see "Schema proposals"
    below.
- **No byline:** story ends on page 299 with `"living this adventure called
  life."` — no author sign-off line follows. Checked: the only line below that at
  y=448.52 is the next page's running header/footer content. Confirmed by probe.
- **Dialogue / inner thoughts:** kept inline within `paragraph` blocks.
  - p012: `"...asking myself, Why am I doing this? Something had to give..."`
    (italic pull-quote kept inline per conventions).
  - p014–p015: multi-turn dialogue between narrator and therapist (with `"..."`
    quotes) stays inside its paragraph(s).
  - p017: the quoted `"Step Seven."` book-chapter reference and the narrator's
    blurted `"What the heck are shortcomings?"` kept inline.

## Flagged blocks

- **`story-the-missing-link-p003`** — the drop-cap-plus-SC-tail merge applied a
  targeted `\bi\b → I` regex. The merged text starts "When I was eight or nine
  years old, life suddenly became very difficult..." which matches the book's
  reading of this passage. Flagging because this is the first structured-
  extraction agent that encountered an SC span that included a standalone
  lowercase-`i` pronoun; prior agents' SC spans either did not contain `i` as
  a standalone word (vicious-cycle had `January 8, 1938`) or the SC/regular span
  boundary fell before the `i` (women-suffer-too had `hat was` then `I saying`
  in separate spans).

## Schema proposals

- **SC-tail case restoration for pronoun "I":** consider adding a conventions rule
  that the drop-cap-tail merge should uppercase standalone `\bi\b` tokens when
  the source font is `NewCaledonia-SC` (the typesetter's small-caps rendering
  suppresses the capital form). Scope: **localized to the drop-cap merge**,
  not a general post-processing rule. Rationale: the SC font always renders
  lowercase codepoints regardless of whether the underlying letter is a capital
  or minuscule, and `i` as a standalone word in English narrative is always the
  pronoun. Risk: near-zero false positives in this localized scope — a standalone
  lowercase `i` elsewhere in body prose would be a different bug.

  If adopted, this could generalize to: "when PyMuPDF span font is `NewCaledonia-SC`,
  apply `\bi\b → I` AND the sentence-initial letter of the SC tail should already
  be the drop-cap character (already handled)". No other case-inverted words arise
  in the observed SC tails.

- **No other proposals.** All Wave 5 accepted rules applied cleanly.

## Uncertainties

- None structural. The targeted SC-tail `\bi\b → I` fix is the only decision that
  isn't fully covered by a written convention; it is documented above.
