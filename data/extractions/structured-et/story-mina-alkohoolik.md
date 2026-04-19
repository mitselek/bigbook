# story-mina-alkohoolik — extraction report

## Summary

Estonian personal story, `personal-stories/they-stopped-in-time` group,
pp 414–419 PDF (382–387 book). Heading preserved verbatim with trailing `?`:
`MINA, ALKOHOOLIK?`. Emitted **24 blocks** (1 heading + 23 paragraphs). Block-
count parity with the English counterpart (`story-me-an-alcoholic`, EN heading
`ME AN ALCOHOLIC?`) is exact: 24/24. No footnotes, no bylines, no list items,
no verse, no blockquote.

## Method

- Library: `pymupdf` via `.venv/bin/python`. Only `page.get_text("dict")` used;
  no `pdfplumber`.
- Line-level walk over pp 414..419, sorted by `(pdf_page, y0, x0)`.
- ET-convention drop rules applied:
  - Running headers/page numbers: `y0 < 45 AND (size <= 11.5 OR text.isdigit())`.
  - Story-number `(13)` on page 414 (y≈67.80, size 13) dropped.
  - Bottom-of-page `382` footer (y≈530.79, size 11) dropped.
- Heading detection: size ∈ [13.5, 15.0] + text matches `MINA...ALKOHOOLIK`.
  Font is `NewCaledoniaLTStd-It` at size 14 — the heading is italic in this
  section (unusual; most ET headings are upright small-caps). The italic style
  does not affect heading emission.
- Deck (subtitle) detection: `-It` font, size ≤ 11.5, y ∈ [100, 140] on p414.
  Two wrapped lines at y≈112.23 and y≈126.73 → emitted as ONE paragraph per
  conventions default.
- Drop-cap: `BrushScriptStd` at 33pt on p414 at (x=56.69, y=142.79). Glyph is
  `P` (wide). First body line at (x=86.85, y=149.91) carrying `üüdes kujutleda…`.
  Merged to `Püüdes kujutleda…`. Wrap-zone band `y ∈ [145, 175]` at `x ∈ [82, 95]`
  absorbs the continuation line at y=164.41 into the same paragraph.
- Cross-page paragraph merge: right-margin carry-over via first-line-indent
  signal. Body margin at `x ≈ 56.69`, paragraph-start indent at `x ≈ 68.03`.
  Only lines with `64.0 ≤ x < 80.0` start a new paragraph; continuation lines
  at x=56.69 append to the current block, including across page boundaries.
  This cleanly handled the p414→p415, p415→p416, p416→p417, p417→p418, and
  p418→p419 transitions (all mid-paragraph).
- ET soft-hyphen join: `U+00AD` at line-end stripped and joined no-space at
  join time. 20+ instances across the section (`klubi\xADliige`,
  `lennuki\xADpiloot`, `alkoholi\xADkogus`, `kuueteist\xADaastasena`,
  `alko\xADholi-järgne`, etc.) all produced the expected joined forms.
- Explicit hyphen preservation: `ammu-ammu`, `AA-s`, `AA-lastest`,
  `alkoholi-järgne` (assembled from cross-line soft-hyphen `alko-`+`holi-järgne`
  where the soft-hyphen strips and the authored hyphen before `järgne`
  survives), `Võib-olla`, `kuueteist-aastasena` — all preserved verbatim
  when authored.

## Schema decisions

- **Story-number `(13)` dropped** — per ET/EN conventions (decorative numbering,
  not authored content). Not included in heading text.
- **Heading includes the `?` verbatim**: `MINA, ALKOHOOLIK?`. The section
  metadata `title` (`Mina, alkohoolik?`) is prose-case; the heading block
  mirrors the visual rendering (all-caps with the same punctuation).
- **Italic deck emitted as one paragraph** (default): two wrapped lines at
  y=112.23 (`Alkohol pitsitas seda kirjameest üsna kõvasti – kuid ta pääses`)
  and y=126.73 (`üsna tervena.`) joined into a single `paragraph` block. No
  multi-paragraph structure in the deck.
- **Mid-paragraph italic emphasis kept inline** — two observed:
  - p415 y=440.41 `ainult mitte seda neetud martinit.` (italic) — flows inside
    its surrounding paragraph p008.
  - p417 y=338.91 `olnud need teadmised jõud.` (italic) — inline in p014.
  - p419 y=121.41 `järele ja teadke, et mina olen Jumal.` (italic psalm quote)
    — inline in p022. All three match the conventions rule "italics alone is
    not a split signal".
- **No byline emitted.** The last paragraph ends with `„..` (double period)
  and is body prose, not an author-attribution block. Story has no sign-off.
- **Fidelity preserved** at the final sentence: `ma ei pea neid enam kunagi
  üksi läbi elama..` — the double period is what the PDF renders. Preserved
  per the "fidelity beats grammatical correctness" ET rule.

## Flagged blocks

- `story-mina-alkohoolik-h001` — italic (heading is typeset in
  `NewCaledoniaLTStd-It`), which diverges from most ET chapter/story headings
  (upright small-caps). Detection-window widened to `size ∈ [13.5, 15.0]` and
  text-match keeps it robust against that style divergence. Confidence: high.
- `story-mina-alkohoolik-p002` (deck) — two-line italic subtitle cleanly
  merged. Confidence: high.
- `story-mina-alkohoolik-p024` final sentence — `üksi läbi elama..` ends with
  two periods in the PDF (verified in the raw dict). Preserved verbatim per ET
  fidelity convention. Flagging so a reviewer knows this is intentional.
- `story-mina-alkohoolik-p024` contains `alkoholi-järgne` — assembled from
  cross-line `alko\xADholi-järgne` on p419 (y=396.91 ends with soft-hyphen,
  y=411.41 begins with `holi-järgne`). Soft-hyphen strips, authored hyphen
  before `järgne` survives. Confidence: high.

## Schema proposals

None. All observed patterns covered by existing ET conventions.

## Kind counts

```text
heading: 1
paragraph: 23
total: 24
```

## Front-matter / metadata verdicts

- `id: story-mina-alkohoolik` ✓ matches metadata
- `kind: story` ✓
- `title: Mina, alkohoolik?` ✓ (prose-case form, trailing `?` preserved)
- `parentGroup: personal-stories/they-stopped-in-time` ✓
- `pdfPageStart: 414` ✓ (heading + deck + drop-cap on this page)
- `pdfPageEnd: 419` ✓ (final paragraph ends on this page)
- `bookPageStart: 382` ✓ (matches the `382` footer dropped from p414)
- `bookPageEnd: 387` ✓ (matches the `387` header on p419)
- Heading `?` preserved: **YES**, both in metadata `title` and in the
  heading block text.
