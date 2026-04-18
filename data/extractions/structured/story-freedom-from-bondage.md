# story-freedom-from-bondage

## Summary

Extracted "Freedom From Bondage" (Part III, They Lost Nearly All, story #14) from PDF pages 550-558 inclusive. Emitted **29 blocks**: 1 heading + 28 paragraphs. No lists, no verses, no footnotes, no tables, no byline. The story has a single drop-cap, a three-line italic deck subtitle, and standard prose throughout. Story-number prefix `(14)` was dropped per conventions.

## Method

- `pymupdf` only (`.venv/bin/python`).
- `page.get_text("dict")` for per-line spans with font/size/bbox.
- Probe run against pages 550-558 saved to `.tmp/freedom-probe.txt` before coding the extractor.
- Line filtering drops: running-title header (y<50 AND size<=9.5), top-of-page digit-only lines (y<50 AND digit-only), bottom-of-page digit-only lines (y>500), first-page story-number `(N)`.
- Paragraph boundary: first-line indent past body-margin+8.
- Drop-cap wrap zone: first-page lines within y=[drop-cap.y+5, drop-cap.y+45] AND x > body-margin+15 are treated as continuations, not paragraph-starts.
- Cross-page merge: right-margin carry-over heuristic — if prev block's last-line x1 > 280pt AND next block's first line isn't para-indented, merge.

## Heuristics fired

- **Running-title + page-number drop** at y<50 (both 9pt title and 12pt digit numerals on pages 551-558).
- **Bottom-of-page digit drop** for page 550's "544" at y=540.74, size 9pt.
- **Story-number drop** for `(14)` at y=79, size 12.5pt on page 550.
- **Heading detection** at size 13.5, contains "FREEDOM" — "FREEDOM FROM BONDAGE" emitted as the single heading.
- **Subtitle single-indent**: 3 italic lines (x0 93.28 / 81.27 / 81.27) → one paragraph block.
- **Drop-cap merge**: "T" (ParkAvenue 51.65) + "he mental twists..." (SC-flattened 12.0) → "The mental twists...". Post-flatten `\bi\b → I` regex applied (no-op on this section; no standalone `i` needed correction).
- **Body-margin parity**: this section has LEFT pages at x=69.28 (even PDF page numbers 550, 552, 554, 556, 558) and RIGHT pages at x=52.28 (odd PDF page numbers 551, 553, 555, 557). This is the **opposite** of what acceptance-was-the-answer used; book spine side flips. Detected manually from the probe; hardcoded into `body_margin()`.
- **Cross-page merges fired**: pages 550→551 (p006), 552→553 (p013), 553→554 (p015), 554→555 (p017), 555→556 (p020), 556→557 (p023), 557→558 (p026). All carry-over sentences whose prior page ended mid-word or mid-sentence.
- **Compound-hyphen cross-line preservation** handled correctly for: `self-sufficient` (p008), `self-pity` (multiple), `self-analysis` (p011), `self-will` (p023), `open-mindedness` (p020), `twenty-three` (p010, p011), `thirty-three` (p011), `thirty-three-year` (p024, multi-hyphen compound). All stems matched the `self-` or number-prefix allowlist; the multi-hyphen compound `thirty-three-year` caught by the `\w+(-\w+){2,}-$` Wave 7 stricter rule.
- **Em-dash line-end join without space** fired for: p010 "band leader—a man", p015 "repetition—I had", p016 "mankind—I was", p020 "question—the "H"", p026 "drunk—and I didn't", p029 "Anonymous—and everything". No em-dash-line-start cases encountered.
- **No multi-paragraph subtitle split**; the italic deck has exactly one indent, so conventions' default (single paragraph) applied.

## Schema decisions

- **Heading block** is the single line "FREEDOM FROM BONDAGE" (visual ALL-CAPS). Conventions-compliant — `title` metadata is prose-case "Freedom From Bondage" and the block preserves the source visual.
- **Story-number `(14)` dropped**, not included in the heading text or as its own block. Per conventions ("lean toward DROP — it is structural numbering").
- **Italic "time." at end of p029** is kept inline with surrounding regular-weight text. The word is emphasis-italic, not a separate byline or block. The full closing sentence reads cleanly: "And when I get what I need, I invariably find that it was just what I wanted all the time."
- **No byline emitted** — this story does not end with an author-attribution sign-off. The anonymous-author convention for Part III stories doesn't produce a byline here.
- **Large quoted passage in p027** (the clergyman's advice on praying for resentments, ~570 chars) kept as a single paragraph block. Conventions are clear: dialogue/quoted prose stays in the surrounding paragraph; `blockquote` is reserved for editorial interludes with distinct typography (smaller font, different indent column). The clergyman quote is body-font-size prose at the standard body margin, internally introduced by "He said, in effect:".

## Flagged blocks

None with genuine uncertainty. Two minor notes:

1. **p027 length (694 chars)** is large because of the clergyman's extended quote. Verified it is a single authored paragraph in the source — the quote is introduced on the prior paragraph boundary (p027 first-line indent at x=81.28 on page 558) and terminates with the closing `"` at the period of "compassionate understanding and love." No paragraph-break inside the quote.

2. **p013 length (1118 chars)** is the longest block and spans a 552→553 cross-page merge. Verified against probe: last line of page 552 is "...to my reaction to my parents leaving me when" → first line of page 553 "I was seven." — genuine mid-sentence carry-over, correct merge.

## Schema proposals

None. All Wave 5-7 rules applied cleanly. No artifacts observed in output. No new block kinds needed for this section.

## Counts

- **heading**: 1
- **paragraph**: 28
- **Total blocks**: 29
- **Pages covered**: 550, 551, 552, 553, 554, 555, 556, 557, 558 (all 9 pages).
