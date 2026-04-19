# story-koidikutest-vabaks — extraction report

## Summary

Structured extraction of "Köidikutest vabaks" (ET counterpart of EN
"Freedom from Bondage"), a Part II.C story in the "They Lost Nearly All"
group. PDF pages 576..584, book pages 544..552. Emitted 29 blocks: 1
heading + 28 paragraphs. No bylines, list-items, verses, footnotes, or
blockquotes present.

## Method

- PyMuPDF `get_text("dict")` across pages 576..584 (0-indexed 575..583).
- Per-line sort by `(page, y0, x0)`.
- Text normalization: ligature expansion, NUL strip, soft-hyphen preserved
  until join time.
- Running header/page-number drop rule (ET): `y0 < 45 AND (size <= 11.5
  OR stripped.isdigit())`.
- Page 576 decorative `(14)` story-number dropped (y~57.31, size 14,
  matched via `STORY_NUMBER_RE`).
- Page 576 bottom-of-page numeric-only footer `544` dropped
  (y~530.79, size 11).
- Drop-cap merge: BrushScriptStd 33pt `M` at (x=54.69, y=145.12)
  merged with first body line at (x~95.25, y~149.57) → `Mind jooma
  viinud ...`. Drop-cap wrap-zone `y in [145..180] AND x in [85..110]`
  absorbs the three subsequent wrapped lines into the same paragraph.
- Paragraph-start detection: `64.0 <= x0 < 80.0` (body indent ~68.03;
  body-margin continuations at ~56.69).
- ET em-/en-/minus-dash line-join heuristic applied
  (space-padded vs tight based on previous-line trailing space).

## Schema decisions

- **Italic deck** on page 576 (3 lines, `NewCaledoniaLTStd-It` at
  y=97.44–126.44) emitted as a single `paragraph` block per the default.
  No multi-paragraph indents within the deck.
- **No byline** — the EN counterpart has no byline either; this is an
  unsigned "As Bill sees it" style sign-off-less story.
- **Drop-cap `M`** is a wide glyph; used `+35` wrap-zone offset (x range
  85..110) per convention.
- **No footnotes**, **no list-items**, **no verses**, **no blockquotes**.
  The `—„H"` / `„O"` / `„W"` sequence on page 581 is inline acronym
  description, not a list — kept within the surrounding paragraph.

## Counts

| Kind      | Count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 28    |
| **total** | 29    |

Pages covered: 576, 577, 578, 579, 580, 581, 582, 583, 584 (all 9).

## Front-matter verdicts

- **Heading** (`h001`): `KÖIDIKUTEST VABAKS` at x=116.96, y=72.31, size
  14.0, centered. Emitted. Metadata `title` `"Köidikutest vabaks"`
  preserved per the divergence rule (prose-case metadata vs visual
  rendering in heading block).
- **Story-number prefix** `(14)` at y=57.31, size 14, centered. Dropped
  per convention (decorative structural numbering).
- **Italic deck** (`p002`): "See noorena liitunud AA-lane usub…" emitted
  as a single paragraph block. One clear paragraph break, no sub-indents.
- **Drop-cap `M`** + first body line `ind jooma viinud…` merged into
  `p003` → `Mind jooma viinud mõtteviisi moonutused…`.

## Flagged blocks

### p005 — `meele​rahu` with U+200B zero-width space

```text
…„leida tasakaalu häda ja viletsuse ning meele​rahu vahel.”
```

The PDF source emits a U+200B ZERO-WIDTH SPACE inside the word
`meelerahu` (likely a typesetting hint for line-break control). Preserved
verbatim per the ET "fidelity-over-correction" policy (same class as
`o1i`, `sõruskonna`, `Bill W,` documented in Wave 1). Flagging in case
future consumers prefer to strip ZWSP in a downstream pass.

### p020 — line-initial em-dash followed by curly quote

```text
…kus —„H" tähendab ausust (honesty)…
```

Source layout: previous line ends `kus ` (trailing space), next line
starts `—„H"`. The em-dash is rendered inline with surrounding space.
Handled via the existing em-dash-at-line-START rule: previous trailing
space → prefix with a space, preserving authored spacing. Matches the
visual rendering.

### p010 / p016 / p026 / p029 — space-padded ET dashes

- p010: `bändiliidriga – mehega` (en-dash U+2013, space-padded, intra-line)
- p016: `inimkonna vastu − lihtsalt` (minus-sign U+2212, space-padded)
- p026: `ennast purju − ja` (minus-sign U+2212, space-padded)
- p029: `mis vajan − ja` (minus-sign U+2212, space-padded)

All within normal ET space-padded-dash usage. Not at cross-line breaks;
no join-side adjustment needed. Listed for completeness.

## Multi-hyphen compounds

**None.** The EN counterpart `story-freedom-from-bondage` has the
compound `thirty-three-year` but Estonian renders this as
`kolmekümne kolme aasta` (space-separated), with no hyphens. Same for
`kahekümne kolme aastaselt`, `kakskümmend viis aastat`, etc.
ET morphology does not produce EN-style multi-hyphen compounds in this
text, so no `^\w+-\w+-$` / connector-word preservation rule was
triggered.

## Real U+002D hyphens observed (intra-line only)

Intra-line authored compound hyphens (preserved as-is, no line-end
splits):

- `AA-lane`, `AA-sse`, `AA-st`, `AA-d`, `AA-le` (AA suffix attachments)
- `Kesk-Läänes` (p006)
- `open-mindedness` (p020, inside English acronym description)

No line-end U+002D cases in this section; the ET Wave 4 "preserve
line-end U+002D" rule did not fire.

## Schema proposals

None. Conventions held cleanly. The zero-width-space artifact is a
flagged quirk but does not warrant a new rule yet (single occurrence;
would need to see more ZWSP instances before generalizing).
