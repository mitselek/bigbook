# story-listening-to-the-wind — extraction report

## Summary

Extracted 43 blocks for `story-listening-to-the-wind` (Part III — They Lost Nearly All, the fourth story at pages 464-475; 12 pages, the longest in Wave 8). Block counts: 1 heading, 42 paragraphs. No verse, list-items, footnotes, blockquotes, tables, or bylines. The story has no sign-off byline — it ends with a plain final paragraph ("... the love and recovery in Alcoholics Anonymous."). All Wave 5-7 rules were applied (bidirectional em-dash line-join, tightened multi-hyphen preservation, number-prefix qualification with leading-alpha regex, narrow capitalized-stem proper-noun allowlist with sentence-initial exclusion, NUL-byte strip). One new forward-lookahead variant was needed for `sister-in-law` (see Schema decisions / proposals below).

## Method

- `pymupdf.open(...)` + `page.get_text("dict")` on pages 464..475.
- Dropped at line-level: running headers (y0 < 50 AND size ≤ 9.5), page numbers (y0 < 50 AND digits-only, OR digits-only AND y0 > 500), the story-number prefix `(4)` on page 464.
- Heading detected by text-match (`LISTENING` in upper-case) at size ≥ 13.
- Subtitle: two italic 11pt lines above the drop-cap on page 464 (`y0 < 170`). Single italic indent group → single `paragraph` block.
- Drop-cap: `I` at size 51.65 in ParkAvenue on page 464. The drop-cap letter is the standalone pronoun `I` followed by a distinct verb (`started`). Per conventions: merge with a space → `"I started drinking when I was around eleven..."`. Drop-cap wrap-zone narrow-glyph offset (+15 body-margin) matches conventions for narrow `I`.
- Body-margin parity: this section is flipped relative to most Part II stories — **even pages use body-margin 69.28** (first page is 464, even), **odd pages use 52.28**. Paragraph-indent threshold = `body_margin + 8`. Visual verification: 42 first-line indents detected across 12 pages, consistent with the resulting 41 body paragraphs (drop-cap wrap collapses the first two indented lines into the first paragraph).
- Cross-page paragraph merge: right-margin carry-over (prev-last x1 > 280) combined with next-block first-line at body margin (within 2pt). All page-to-page merges on this story fired correctly; no paragraph is split across a page.

## Schema decisions

- **Drop-cap as pronoun `I`** — joined with space to the first body word (`I started`), not concatenated (`Istarted`). Follows the Wave 2 dr-bobs-nightmare precedent.
- **No story-number in heading** — conventions default (drop structural `(N)` numbering).
- **Single-paragraph subtitle** — the 2-line italic deck reads as one sentence with one natural line break; the second line is *less* indented than the first, which is not the "multiple clear first-line indents" structured-deck signal. Single `paragraph` block is the conventions default.
- **No byline** — the final page (475) ends with prose paragraph `Everything is sacred as a result of the Twelve Steps and the love and recovery in Alcoholics Anonymous.` There is no italic sign-off or author attribution.

## Flagged blocks

- **p003** — drop-cap merge. `"I started drinking when I was around eleven years old. I stayed with my brother and his wife just outside of Gallup, New Mexico. We were poor. ..."` Reviewed: reads correctly.
- **p012** — `sister-in-law` required a new forward-lookahead variant. Source ends one line with `"...went to live with my brother and sister-"` and the next line starts with the single token `"in-law."`. The existing forward multi-hyphen lookahead expected `<connector> <hyphenated-token>` as two separate tokens (`or five-hour`), but here the connector `in` is *part of* a single hyphenated continuation token. I added a second branch: when the first next-line token itself contains `-` and its leading segment is a known connector, preserve the trailing hyphen. Result: `sister-in-law`. See Schema proposals below.
- **p014** — `one-year-old`. Handled correctly by the stricter multi-hyphen preservation rule (tail already had `-year-` when processing the second break would have triggered). Actually here the source renders it on a single line (`"...with my one-year-old son."`) so no line-join decision was needed. Listed for completeness.
- **p016** — `"super-mom"`. Single-line token in source; kept as-is.
- **p041** — contains `twenty-two`, `self-destructive`, `well-being`, all on-line tokens. Preserved as compounds.

## Schema proposals

- **Forward-lookahead variant for single-token connector compounds.** The Wave 7 forward multi-hyphen lookahead (four- / or five-hour) expects the connector word as a separate token. Three-part compounds like `sister-in-law`, `mother-in-law`, `father-in-law` split with `sister-` at line end and `in-law.` as a single hyphenated token on the next line. Add a sibling rule: "if the previous line ends with a cross-line hyphen AND the first token of the next line contains a hyphen AND that token's leading segment is a short connector word (`in`, `to`, `of`, `a`, `or`, `and`), preserve the trailing hyphen." I implemented this locally; recommending it for the conventions doc.

- **Body-margin parity can be flipped per section.** Most prior waves documented odd pages → 69.28, even → 52.28. This section is the reverse because the first page (464) happens to be even-numbered and carries the deeper margin. The `body_margin(pdf_page)` helper should be inferred per section rather than assumed a fixed parity — conventions already say "infer per section" but it is worth re-emphasizing for Wave 8 agents (one per appendix and remaining stories).

## Known-clean cross-line hyphens in output

```
middle-aged       (p006)
twenty-six        (p008)
six-pack          (p008)
first-born        (p012)
sister-in-law     (p012)  <- forward-lookahead variant
one-year-old      (p014)
super-mom         (p016)
rush-hour         (p018)
six-car           (p029)
twenty-two        (p041)
self-destructive  (p041)
well-being        (p041)
```

No artifact hyphens survive in the output (audited with `re.findall(r'\b\w+-\w+\b')` against every paragraph).

## Verification

- `json.load(...)` succeeds.
- Block count 43 = 1 heading + 1 subtitle + 41 body paragraphs.
- Independent source-side count of first-line indents (42) − 1 for the drop-cap wrap collapse = 41, matching the body paragraph count exactly.
- First block text `"LISTENING TO THE WIND"`; last block text ends `"... and the love and recovery in Alcoholics Anonymous."` matching the source final sentence.
