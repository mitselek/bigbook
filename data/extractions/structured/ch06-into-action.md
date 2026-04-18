# ch06-into-action — structured extraction report

## Summary

Extracted chapter 6, "Into Action" (PDF pages 93–109, 17 pages — the longest remaining chapter). Output: **53 blocks** total — 1 heading + 52 paragraphs. No list-items, no verse, no blockquotes, no footnotes, no tables, no bylines. The extraction is pure prose with a drop-cap opener plus several inline italic lead-ins and quoted prayers.

## Method

- PyMuPDF `page.get_text("dict")` per page across PDF pages 93..109.
- Standard conventions: ligatures normalized, soft hyphens stripped, curly quotes preserved.
- Paragraph boundary detection by first-line indent (body_margin + 12pt). Body margin varies by page parity (odd pages ~72, even pages ~55) and is inferred per page from the minimum x0 of size-12 NewCaledonia body lines.
- Cross-page paragraph merge: paragraphs wrapping across a page boundary are merged because the next page's first body line is at the body margin (no indent), which our rule correctly treats as continuation rather than para-start.
- Script: `.tmp/extract-ch06.py`.

## Schema decisions

1. **Heading text `INTO ACTION`** — emitted verbatim from the size-13.5 centered line on p93. Matches section metadata `title: "Into Action"` (intentional divergence per conventions: visual heading renders uppercase, prose-case title is metadata).
2. **"Chapter 6" label dropped** — size 12.5, `NewCaledonia-Italic`, above the heading on p93. Per conventions doc.
3. **Drop-cap `H` + small-caps tail `aving made ...`** merged into the first paragraph as `Having made ...` (no space, small-caps tail flattens naturally because PyMuPDF extracts SC-font glyphs as lowercase letters in the `text` field — no manual case flattening needed). The drop-cap wrap zone (y<175 on p93) was detected and the wrapping body line at x≈113 was joined as a continuation rather than a new paragraph.
4. **Seventh Step Prayer** (`"My Creator, I am now willing ... Amen."` on p97) — kept inline within its surrounding paragraph per the Third-Step-Prayer precedent. Not italicized in the PDF; italics only mark the lead-in `"Step Six."`.
5. **Ninth Step Promises** (pp104–105, "If we are painstaking ...") — span two consecutive paragraphs in the source typography (`p038` on p104 and `p039` on p105). Preserved as two paragraphs because the source has a clear paragraph break at "Are these extravagant promises? We think not." — new first-line indent. No italic markup to suggest a pull-out; kept as ordinary prose.
6. **Italic lead-in phrases** — several occurrences (`Step Six.`, `Steps Eight and Nine.`, `Step Eleven suggests prayer and meditation.`, `alcohol.`) rendered in `NewCaledonia-Italic` for one line each. Per conventions, italics alone is not a split signal; kept inline. The inline italic is lost in the plain-text output — agents consuming block text won't see the emphasis but semantic flow is preserved.
7. **Page-number numerals size 12** — discovered that page numbers in the running header area (y≈35) are rendered in `NewCaledonia-SC` at size 12.00, same as body text. The conventions-doc rule "size <= 9.5" does NOT catch these. Fix applied locally: drop any line at `y0 < 50` that is EITHER `size <= 9.5` OR numeric-only content (`stripped.isdigit()`). See "Schema proposals" below.
8. **Multi-hyphen compound `life-and-death`** — found on p96: source line ends `"...engaged upon a life-and-"` and next line begins `"death errand."`. The current cross-line-hyphen rule strips the trailing `-` when the preceding token (`and`) isn't in the compound allowlist, producing `life-anddeath`. Fix applied locally: added a secondary guard — if the line already contains a `-word-` pattern before the line-ending `-` (e.g. `life-and-`), treat as a multi-hyphen compound and preserve the hyphen. See "Schema proposals" below.

## Flagged blocks

None. All paragraph boundaries fall on first-line indents and all paragraphs end with sentence-terminal punctuation. All cross-page paragraph merges verified (p003, p007, p016, p021, p029, p030, p041, p044, p047).

## Schema proposals

Two refinements from this section that should be propagated to later waves:

### Proposal A — qualify the running-header / page-number drop rule

**Current convention:** drop at y0 < 50 AND size <= 9.5.

**Observed in ch06:** page numbers in running headers are `NewCaledonia-SC` at size **12.00** (identical to body-text size), not size 9. The small-font text at size 9 is the running title ("INTO ACTION" / "ALCOHOLICS ANONYMOUS"), but the page-number itself is size 12. An `y0 < 50 AND size <= 9.5` rule drops only the running title, leaving the page-number intact and merging it mid-paragraph (observed `"...if we 74 expect to live long..."` before the fix).

**Proposed refinement:** at `y0 < 50`, drop if EITHER `size <= 9.5` OR `stripped.isdigit()`. The numeric-only constraint at top-of-page is unambiguous — no legitimate body content is purely digits at the top margin.

This pattern likely affects every chapter in the book (the SC-12 page numbering is clearly template-driven). Worth verifying against outputs of previous waves for hidden mid-paragraph digits.

### Proposal B — preserve multi-hyphen compounds at line breaks

**Current convention:** preserve hyphen at line-break only when the preceding token is in the compound-prefix allowlist (`self-`, `well-`, `co-`, ...).

**Observed in ch06:** `life-and-death` spans a line break as `"life-and-"` → `"death"`. `and` is not in the allowlist (and shouldn't be, since `and-` alone means nothing). The strip-hyphen branch produces `life-anddeath`.

**Proposed refinement:** before stripping the trailing `-`, check if the current out-buffer already contains a `-word-$` pattern (a hyphen-word-hyphen tail). If so, we are inside a multi-hyphenated compound and should preserve the line-break hyphen. Regex: `re.search(r"-[A-Za-z]+-$", out)`.

Known compounds this covers: `life-and-death`, `face-to-face`, `by-and-by`, `hand-to-hand`, `mother-in-law`, `day-to-day`, etc. None of these appear multiple times in the corpus, but missing any of them creates a conspicuous typo (`life-anddeath`).

## Verse / drop-cap / italic-prayer verdicts

- **Verse:** none emitted. None present in the source — zero false positives.
- **Drop-cap:** `H` (ParkAvenue 51.65pt) merged cleanly with SC-tail continuation → first paragraph opens `"Having made our personal inventory, ..."`. Verified.
- **Italic prayers:** none emitted as separate blocks. The Seventh Step Prayer (p97 "My Creator, I am now willing that you should have all of me, good and bad. ... Amen.") is inline with its introducing paragraph. The Ninth Step Promises (p104–p105) are inline across two paragraphs following source typography. "Thy will be done." quotations on p106 and p109 are inline. All per conventions precedent (Third-Step-Prayer rule: italics alone is not a split signal; dialogue/quoted speech stays in its paragraph).
