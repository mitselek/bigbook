# story-gratitude-in-action — extraction report

**Date:** 2026-04-18
**Wave:** 2 (first Personal Story subagent; chapter sibling = ch01-bills-story from Wave 1B)
**Input:** `legacy/assets/AA-BigBook-4th-Edition.pdf`, pages 208-214 (1-indexed).
**Output:** `data/extractions/structured/story-gratitude-in-action.json`, 26 blocks.

## 1. Summary

First personal-story extraction of the Structured Extraction pipeline. Story #2 ("Gratitude in Action"; Dave B., Canada, 1944) from Part II, "Pioneers of A.A." Seven-page story, pure prose — no verse, no footnote, no byline at the end, no tables.

Final block count: **1 heading + 25 paragraphs = 26 blocks.** No layout artifacts leaked through. No false verse detection. `parentGroup` preserved.

## 2. Method

Reused the ch01-bills-story extractor skeleton. PyMuPDF `page.get_text("dict")` for per-line bbox/font/size; identical drop-cap + layout-artifact filter logic; narrowed the conventions doc's compound-prefix allowlist (see §3 below).

Heuristics that fired:

- Body margins: odd pages 209/211/213 at x ≈ 69.3, paragraph indent ≈ 81.3; even pages 208/210/212/214 at x ≈ 52.3, paragraph indent ≈ 64.3. Paragraph boundary = `x0 >= body_margin + 8`.
- Drop-cap: ParkAvenue 51.7 pt at y ≈ 168.9 on p208 (x=54.7, immediately at body margin — not indented past it, unlike ch01 which had drop-cap inside the indent zone — this one actually sits AT the body margin because the surrounding line's indent accommodates the glyph).
- Drop-cap wrap zone: lines at y < 213 on p208 with x ≈ 77.5 are continuations of the drop-cap paragraph wrapping around the glyph, not new paragraph starts.
- Running-element filter: `y0 < 50` drops page-top headers (both "GRATITUDE IN ACTION" 9 pt on even pages and "ALCOHOLICS ANONYMOUS" 9 pt on odd pages, plus the SC page numbers); `y0 > 500` drops the bottom-of-page SC page number on p208 (`193`).
- Story-number `(2) ` dropped via regex `^\(\d+\)\s*$` on p208 (size 12.5 NewCaledonia at y ≈ 79).

Scripts written only under `.tmp/` (gitignored): `probe-story-gratitude.py`, `extract-story-gratitude.py`. No source-code changes.

## 3. Schema decisions

### Story-number `(2)` — **dropped entirely** (not bundled into heading)

Rationale: structural numbering, not authored content. The convention-doc leans toward DROP. The heading block text is the clean `GRATITUDE IN ACTION` without the `(2)` prefix.

### Multi-line subtitle — **emitted as single `paragraph` block**

The italic deck on page 208 spans two lines (`The story of Dave B., one of the founders of A.A. in` / `Canada in 1944.`). Joined with a single space into one paragraph:

> The story of Dave B., one of the founders of A.A. in Canada in 1944.

Alternative considered: emit as `heading` (level-2). Rejected because (a) the current schema has no heading-level field; (b) it reads as a prose description, not a hierarchical heading; (c) paragraph is what the conventions doc suggests as the default.

If a later schema refinement adds `level` to `heading`, this block is a candidate for reclassification.

### Drop-cap merge — `"I" + "believe"` → `"I believe"` (space separator)

The drop-cap `I` (ParkAvenue 51.7 pt) glyph is dropped as a standalone visual element; the character `I` is synthesized as a space-separated prefix on the first body line. Rationale per conventions doc: single-letter drop-cap followed by a complete word that does NOT begin with that letter gets a space ("I believe" is a two-word start of a sentence; "I" and "believe" are separate words). Contrast with ch01 where `"W" + "ar" → "War"` (no space, because "ar" is the tail of "War").

Confirmed by inspecting the source: the drop-cap glyph reads `I` + NUL padding (`'I\x00'`), and the next line's lowercase small-caps text is `believe it would be good...`. The resulting sentence `I believe it would be good to tell the story of my life.` is the intended reading.

The drop-cap paragraph continues for 3 more lines wrapping around the glyph (x ≈ 77.5) before returning to body margin (x ≈ 52.3) at y ≈ 211.6. All correctly collected into a single `paragraph` block, terminated by the paragraph-start indent at y ≈ 300.2 ("In June 1924…").

### Byline — **no byline present**

The story ends with body prose: `…to keep my hand in the hand of God.` No italic attribution, no `-- Dave B.` sign-off. This story is attributed only via the subtitle at the top. No `byline` block emitted. (Compare ch01, which had italic `Bill W., co-founder of A.A., died January 24, 1971.` at the end.)

### Compound-prefix allowlist — **narrowed for this extraction**

The conventions doc (Wave 1B, accepted) lists 12 compound prefixes to preserve across line-breaks: `self- well- co- non- ex- re- pre- semi- anti- sub- super- multi-`.

In practice on this story's prose, `re-` and `pre-` hit false positives:

- p208 line-end `to re-` + line-start `member that I` → if allowlist preserves `re-`, output becomes `"to re- member"`. The intended word is `remember` (single word).
- p211 line-end `go work, and re-` + line-start `turn home` → would yield `"and re- turn"`. The intended word is `return`.

Both are mid-word hyphenation that should be stripped. I narrowed my local allowlist to `self- well- co- non- ex- semi- anti- multi-`, omitting `re- pre- sub- super-`. This correctly produced:

- `"to remember"` in p003,
- `"and return home"` in p012,
- `self-pity` preserved in p011 (no wrap; allowlist still applies if needed),
- `well-known` preserved in p013,
- `French-speaking` preserved across wrap in p022 (via the `grand-`-style non-allowlist fallback: any internal hyphen not matched by allowlist AND followed by lowercase is stripped, but `French-speak-ing` specifically has its *trailing* hyphen treated as a mid-word hyphenation join, producing `"French-speaking"` — the medial hyphen survives because the trailing hyphen is what gets removed).

**Schema proposal (see §5)**: the conventions doc should narrow the allowlist, or the heuristic should require the preceding line's prefix to be a standalone token (preceded by whitespace or line-start without intervening word-chars). The current `re-` / `pre-` entries make confident extraction worse.

## 4. Flagged blocks

None flagged as uncertain. All 26 block boundaries matched the visual paragraph starts in the PDF. Double-checked by reading each paragraph against the probe output.

One cosmetic observation: p003 has a slightly awkward first sentence because the drop-cap merge synthesizes the `I` character. The final text reads naturally ("I believe it would be good to tell the story of my life."), but anyone debugging the drop-cap must know the actual glyph on the page is a 51.7 pt ParkAvenue `I` that is NOT part of the body line's text run — it's a separate PyMuPDF line.

## 5. Schema proposals

### PROPOSAL: Narrow the compound-prefix allowlist (or harden its heuristic)

**Problem:** Prefixes `re-`, `pre-`, `sub-`, `super-` produce false positives in body prose because English uses these letter sequences at the start of thousands of unhyphenated words (remember, return, prepare, submit, superfluous). Line-end hyphenation of those words is common.

**Options:**

1. **Narrow the allowlist** to prefixes that are (close to) always hyphenated in modern English: `self- well- co- non- ex- semi- anti- multi-`. Downside: a true `re-emerged`-style compound would now be mis-joined as `reemerged`. In practice this is rare in this corpus; I checked ch01 and this story and found no such case.

2. **Require preceding whitespace.** Only preserve the hyphen when the text preceding the trailing `-` is exactly the prefix as a standalone token (e.g. line ends with `...was re-` where the token `re` is preceded by space). The current code already does this via `tail_token.endswith(" " + pref)`, but when the prefix appears mid-phrase — e.g. `...forgot to re-` — the tail_token is `re-` (not `to re-`), and the check still matches because the regex `\S+-` at line-end captures just `re-`. The check `tail_token.endswith(" " + pref)` never fires (no space inside `re-`); only the `tail_token == pref` branch fires. So the current heuristic is already "prefix IS the entire last word". The false positive happens because the LINE-ENDING word LOOKS LIKE the prefix but is actually the first syllable of a longer word (`re-` of `remember`, not the prefix `re-` of `re-emerged`). Distinguishing those requires a dictionary check.

3. **Dictionary check on the joined form.** Join with hyphen removed and test against a small "known compounds" allowlist (`well-known`, `self-pity`, `co-founder`, `re-emerged`, etc.). Heavier, but correct.

**My recommendation:** Option 1 for now (narrow the allowlist). Revisit when Wave 5-7 story agents encounter a true `re-` / `pre-` / `sub-` compound across a line-break that gets mis-joined — at that point, upgrade to Option 3.

### Adopted for this extraction (local deviation, flagged)

My `extract-story-gratitude.py` narrows `COMPOUND_PREFIXES` to the 8-entry set above. The conventions doc should be updated to match, or to describe the heuristic upgrade path.

## 6. Observations for later story-section subagents

Story-opening conventions discovered on this first story:

1. **Story-number prefix** is at y ≈ 79, NewCaledonia size 12.5, matching regex `^\(\d+\)\s*$`. Same font family as body but slightly larger. Filter by exact pattern — don't over-match.

2. **Heading** is NewCaledonia size 13.5 at y ≈ 100-105, all caps. Same detection logic as chapter titles from Wave 1.

3. **Subtitle** is NewCaledonia-Italic size 11 at y ≈ 130-145, centered. One or two lines. Spans from the bottom of the title to the top of the drop-cap y-band. Detect by (italic font AND size < 11.5 AND y < 160 on the first page).

4. **Drop-cap** is ParkAvenue > 40 pt at y ≈ 165-175 on the first page. For stories (unlike ch01), the drop-cap's `x0` may be **at** the even-page body margin (~52.3) rather than inside the indent zone. The surrounding body line wrap-indent (~77.5) is what's indented past the body margin to accommodate the glyph.

5. **Drop-cap wrap-around zone** extends ~45 pts vertically from the drop-cap's y0. Lines in this zone at the wrap-indent x (not body-margin x) are continuations, not new paragraphs.

6. **Running-header alternation** on odd vs even pages: odd pages show "ALCOHOLICS ANONYMOUS" and a left-side SC page number; even pages show the story title (e.g. "GRATITUDE IN ACTION") and a right-side SC page number. Both are at y < 50 and get caught by the standard top-of-page filter.

7. **No byline at the end of this story** — contrast with ch01 which had one. Later stories may or may not have bylines; detect by small italic font (size < 10) at y > 500 or (more reliably) at x-position suggesting right-alignment or centering, not body margin.

8. **Ligatures** observed: `ﬁ` (fi) and `ﬂ` (fl) appear throughout (`ﬁrsthand`, `diﬃculty`, `conﬁdence`, `peaceﬁl`, etc). Normalization to ASCII digraphs works cleanly via the standard U+FB01/FB02 map.

9. **PDF coordinate details (letter-size page):** y-range ≈ 37-540, body x-range ≈ 52-343 on even pages, ≈ 69-343 on odd pages. Bottom-of-page page-number SC at y ≈ 540 on the very first page of the section only; subsequent pages have running headers at y < 50 instead.

Reusable-heuristics verdict: ch01's extractor skeleton **transplanted without issue** to this story. The only code-level change was (a) the narrowed compound allowlist (deviation flagged above), (b) story-number regex filter, (c) subtitle-collection for multi-line italic deck, (d) drop-cap character `I` (not `W`) with space-separator (not no-separator). Future story subagents should expect similar structural shape and can start from this extractor.
