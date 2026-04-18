# story-aa-taught-him-to-handle-sobriety — extraction notes

## Summary

Last story of Part III (They Lost Nearly All), pages 559–565 — the final story in the book.
30 blocks emitted total: 1 heading + 29 paragraphs. No list-items, no verse, no blockquotes,
no footnotes, no tables, no byline. Clean extraction.

## Method

- PyMuPDF `page.get_text("dict")` for per-line font / size / bbox.
- Standard Wave 7 conventions: compound-hyphen allowlist, number-prefix qualification,
  narrow capitalized-stem allowlist with sentence-initial exclusion, em-dash bidirectional
  join-without-space, multi-hyphen tightened preservation, cross-page right-margin
  carry-over merge.
- Body-margin parity: this section's ODD pages (559, 561, 563, 565) use inner margin
  x≈52.28 (book page set on the RIGHT side of the spread), EVEN pages (560, 562, 564)
  use inner margin x≈69.28. This is opposite to `story-acceptance-was-the-answer`
  (which starts on a book-page-418-even). Verified empirically from the probe; body-margin
  function hard-codes the correct parity for this section.
- First-page filtering: story-number `(15)` at y≈65 size=12.5 dropped; bottom page-number
  `553` at y>500 dropped; running headers + running page numbers on pp 560–565 dropped by
  the y0<50 + size<=9.5-OR-all-digits rule.

## Schema decisions

### Heading — two-line merge, NO abbreviation expansion

The PDF renders the heading across two centered lines at size 13.50 NewCaledonia:

- Line 1 (y=88, x=85.13): `A.A. TAUGHT HIM TO HANDLE`
- Line 2 (y=108, x=154.40): `SOBRIETY`

Merged into a single `heading` block:

> `A.A. TAUGHT HIM TO HANDLE SOBRIETY`

**Divergence from `story-aa-number-three`:** the prompt flagged the possibility that the
heading might expand `A.A.` to `ALCOHOLIC ANONYMOUS` (the precedent from aa-number-three,
where the PDF literally prints `ALCOHOLIC ANONYMOUS NUMBER THREE`). It does NOT here — the
PDF prints `A.A.` literally. Per conventions the `heading` block text preserves the PDF's
visual rendering; I emit `A.A. TAUGHT HIM TO HANDLE SOBRIETY` verbatim. Section `title`
metadata remains the prose-case `A.A. Taught Him to Handle Sobriety`, so the title/heading
divergence here is only the case change, not an abbreviation expansion.

### Story-number `(15)` — dropped

Per conventions, structural numbering is dropped rather than merged into the heading.

### Subtitle — single paragraph

Three italic lines at y=136..163 forming one indent group (first line x=76.28, continuations
x=64.27). Emitted as a single `paragraph` block (p002):

> `"God willing, we . . . may never again have to deal with drinking, but we have to deal with sobriety every day."`

The ellipsis `. . .` (three periods separated by spaces) is preserved as in the source.
This is the *same* epigraph the narrator quotes in the closing paragraph p027 (`God willing,
we members of A.A. may never again have to deal with drinking...`) — a bookended structure.

### Drop-cap `W` + small-caps tail

ParkAvenue `W` at 51.65pt at y=187.62 page 559, followed by the SC first body line
`hen I had been in A.A. only a short while, an` at y=200.83. Merged: `W` + `hen I had been...`
→ `When I had been...` (no space between drop-cap and word remainder). The lowercase `i`
pronoun post-flatten fixer was applied defensively; no replacements needed in this section
(the SC tail here had `I` rendered correctly by PyMuPDF).

### Mid-paragraph italic line kept inline

On page 564 y=273, the line `before my alcoholism became acute. (She no longer` is set in
`NewCaledonia-Italic` while the surrounding paragraph is regular `NewCaledonia`. Per
conventions italics alone is a weak split signal — kept inline with its surrounding
paragraph (p025). The parenthetical `(She no longer weeps in the night.)` reads naturally
as an aside in the author's voice, not a set-off quotation.

### No byline

The story closes with `And with God.` on p565 y=506.93 — no sign-off, no author attribution,
no dedication line. The book itself ends here (page 565 is the last page of the final story;
appendices follow at new page numbering). Emit nothing.

## Flagged blocks

None. All cross-line hyphenations resolved cleanly:

- `over-` + `achiever` → `overachiever` (non-allowlisted prefix, stripped) — `p008`.
- `com-` + `pany` → `company` — `p009`.
- `uncon-` + `trollable` → `uncontrollable` — `p012`.
- `pot-` + `belly` → `potbelly` — `p017`.
- `re-` + `liability` → `reliability` — `p025`.
- `Alco-` + `holics` → `Alcoholics` — `p026` (capitalized-stem narrow allowlist correctly
  did NOT preserve; `Alco-` is not in the proper-noun allowlist).
- `sensi-` + `tivity` → `sensitivity` — `p029`.
- `posi-` + `tion` → `position` — `p030`.
- `self-help` (intra-line, p012), `full-blown` (intra-line, p005), `twenty-two`
  (intra-line, p009), `twenty-nine` (intra-line, p012), `half-year` (intra-line, p023),
  `self-pity` (intra-line, p028) — all kept as authored, no cross-line splits.

Em-dashes in body text (e.g. `drink—a tiny glass` p004, `interludes—which is` within p005/6,
`sobriety—which` p006, `kid—a skinny, shy kid—to` p007, `twenty-` + `two` p009 etc.) all
preserved, no space leakage.

## Schema proposals

None. All conventions covered this section cleanly. The heading-line merge (two centered
lines at heading font size) is already documented and implemented — this section is a
straight instance of that pattern.

## Uncertainties

None material. The one spot worth a second glance is the epigraph's internal `. . .`
(U+0020 ellipsis) — I chose to preserve the source's literal "space-period-space-period-space-period"
rendering rather than normalize it to the unicode `…` (U+2026) or a collapsed `...`. The
closing paragraph p027 quotes the same line without the ellipsis (it's the full sentence
there), so the epigraph's `. . .` is specifically marking an omission — worth preserving
as authored typography.
