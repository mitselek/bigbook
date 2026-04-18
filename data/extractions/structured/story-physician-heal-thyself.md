# story-physician-heal-thyself — extraction report

## Summary

Section: `story-physician-heal-thyself` (Part II.B — They Stopped in Time, story 4/18, PDF pages 312..319). Emitted **24 blocks**: 1 heading + 23 paragraphs. No verse, no list-items, no footnotes, no blockquote, no table, no byline. Clean run once the capitalized-stem hyphen-preservation rule was narrowed to a proper-noun allowlist.

## Method

- PyMuPDF `page.get_text("dict")` across pages 312..319.
- Line filter: drop running headers (`y0 < 50 AND size <= 9.5`), drop page numbers (`y0 < 50 AND stripped.isdigit()` for top-of-page, `stripped.isdigit() AND y0 > 500` for bottom-of-page), drop the story-number `(4)` on page 312.
- Heading: matched `"PHYSICIAN" in text.upper()` at size ≥13, y=102 page 312.
- Subtitle: 2 italic 11pt lines on page 312 at y<170 — joined as a single `paragraph` block (single indent group, per conventions default).
- Drop-cap: `I` ParkAvenue 51.65 at x0=54.73 page 312. First body line at y≈182, x0=79.28, NewCaledonia-SC (small-caps-tail). Merged as `"I " + first body text.lstrip()` since `I` is a standalone single-letter word followed by a complete separate word (`am`), per conventions.
- Drop-cap wrap zone: lines at `y0 < dropcap.y1` and `x0 > body_margin+15` inherit the current paragraph (no false paragraph break).
- Body: paragraph boundary = first-line indent past body margin. Even pages (312, 314, 316, 318): bm=52.28, para threshold=64.28. Odd pages (313, 315, 317, 319): bm=69.28, para threshold=81.28.
- Cross-page paragraph merge: right-margin carry-over heuristic (`prev last line x1 > 280 AND next first line at body margin within 2pt`). Fired for several cross-page continuations.
- Hyphen/em-dash normalization per current Wave 6 conventions (see "Schema decisions" for the one narrowing).

## Schema decisions

1. **Story-number `(4)`**: dropped (decorative structural numbering, per conventions).
2. **Subtitle**: single `paragraph` block, joined to `"Psychiatrist and surgeon, he had lost his way until he realized that God, not he, was the Great Healer."` The two italic lines share a single indent group.
3. **Drop-cap**: merged with `"I " + body.lstrip()` (space-inserted because `I` is a complete word followed by another complete word `am`).
4. **Title vs heading divergence**: metadata `title` is prose-case `"Physician, Heal Thyself!"`; heading block text is the visual `"PHYSICIAN, HEAL THYSELF!"`.
5. **5 1⁄2 years**: appears on a single size-12 line at page 316 y=317; no superscript-fraction fold needed (the `⁄` U+2044 is already inline at body size).
6. **Capitalized-stem hyphen preservation — narrowed to a proper-noun allowlist.** The conventions rule as written ("If the string preceding the line-end `-` starts with an uppercase letter, keep the hyphen") produced four false positives in this section:
   - `Alco-` + `hol` (sentence-initial "Alcohol")
   - `Com-` + `pletely` ("Completely" after a semicolon)
   - `Anony-` + `mous` ("Anonymous")
   - `Anon-` + `ymous` ("Anonymous")
   In every case the stem is a sentence-start word, not a proper-noun prefix. I replaced the blanket "uppercase first letter → keep" rule with a narrow allowlist that matches the spec's **examples** (`God-`, `Anglo-`, `Franco-`, `Judeo-`, `Afro-`, `Indo-`, `Greco-`, `Sino-`). The existing `God-knows-who` case (p012) correctly keeps hyphens under this narrower rule (`God-` is in the allowlist; then the multi-hyphen backward-looking rule `-[A-Za-z]+-$` catches `-knows-` and keeps the second hyphen). See **Schema proposals** below.
7. **Forward multi-hyphen compound lookahead.** The source has `four-` + `or five-hour` (page 317 y=317 → y=331). The existing number-prefix qualification rule strips the `four-` hyphen because `or` is not a fraction tail, producing `fouror five-hour`. Added a forward lookahead: if the previous line ends with a number-prefix hyphen AND the next line starts with a short connector word (`or`, `to`, `and`, `in`, `of`) followed by a hyphenated token, preserve the trailing hyphen. Result: `four-or five-hour`. See **Schema proposals** below.

## Flagged blocks

- **p014** `story-physician-heal-thyself-p014`: first word is `“Com-` at page 316 y=244. Cross-line `Com-` + `pletely` → `Completely`. Resolved via the narrow proper-noun allowlist. Verify: text contains `"Completely give themselves"` (not `"Com-pletely"`).
- **p018** `story-physician-heal-thyself-p018`: contains `four-or five-hour operation`. Forward multi-hyphen compound lookahead fired. Source on the page reads `long four-` / `or ﬁve-hour operation`. The suspended-hyphen after `four` is authored; keeping it preserves the `four-or five-hour` pattern.
- **p022** `story-physician-heal-thyself-p022`: the final `But—Alcoholics Anon-` + `ymous has helped.` joins correctly to `Anonymous has helped.` after the narrowed capitalized-stem rule.
- **p020** `story-physician-heal-thyself-p020`: the single long paragraph with the "dishes" declaration ("I would like to start off by doing the dishes.") is emitted as one block. No splits triggered.
- **p024** `story-physician-heal-thyself-p024`: `"To me it is God."` — last line on page 319 y=404, x0=81.28 (paragraph indent past bm 69.28). Emitted as its own paragraph because it sits at paragraph-indent threshold. Visually this is the story's emphatic close.

## Schema proposals

1. **Narrow the capitalized-stem hyphen-preservation rule to a proper-noun allowlist.** The current convention text reads: *"If the string preceding the line-end `-` starts with an uppercase letter (e.g. `God-`, `Anglo-`, `Franco-`, `Judeo-`), keep the hyphen."* This blanket rule breaks on sentence-initial line-break-hyphen cases (`Alco-hol`, `Com-pletely`, `Anony-mous`, `Anon-ymous`, all observed in this section). Proposed tightening: treat the examples as an allowlist and only preserve when the stem matches a known proper-noun prefix. Starter set: `God-`, `Anglo-`, `Franco-`, `Judeo-`, `Afro-`, `Indo-`, `Greco-`, `Sino-`. Extensible as new cases surface.

2. **Forward multi-hyphen compound lookahead.** The current multi-hyphen compound preservation rule is backward-looking only (regex `-[A-Za-z]+-$` on `out`). This misses the case where the split is at the **first** hyphen of a compound like `four-or-five-hour` (source wraps as `four-` / `or ﬁve-hour`). Proposal: if the prior line ends with a number-prefix hyphen AND the next line's first token is a short connector word (`or`, `to`, `and`, `in`, `of`) AND the next line's second token contains a hyphen, preserve the leading hyphen. This catches suspended-hyphen compounds like `four-or-five-hour` / `two-to-three-year` / `ten-or-twelve-minute` cleanly.

Both fixes are implemented locally in `.tmp/extract-story-physician-heal-thyself.py`. They are safe, narrow refinements — not conventions-breaking changes — and should slot into the shared conventions doc for Wave 7+ agents.

## Block counts

- heading: 1 (`h001`)
- paragraph: 23 (`p002`..`p024`)
- total: 24
- pages covered: 312, 313, 314 (×5), 315 (×2), 316 (×3), 317 (×2), 318 (×2), 319 (×4)
