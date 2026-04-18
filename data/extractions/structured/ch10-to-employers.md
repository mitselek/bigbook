# ch10-to-employers — structured extraction report

## Summary

Extracted pages 157–171 of the 4th-Edition PDF into 53 blocks: 1 heading, 51 paragraphs, 1 footnote. The chapter is prose-heavy with no lists, no tables, no verse, no bylines, and a single footnote. Structure is straightforward once the chapter-opener artifacts are stripped (Chapter-10 italic label, bottom-of-page number, drop-cap "A" and its two-line wrap zone). Output is valid JSON, ids are unique and continuously numbered.

## Method

- PyMuPDF only (`page.get_text("dict")`).
- Font-based heading detection (`size >= 13.0`, text match against "TO EMPLOYERS") isolates the heading on page 157.
- Drop-cap "A" identified by `font == "ParkAvenue" and size > 40` and merged with the following wrap line as "A" + line text (no space).
- Drop-cap wrap-zone handling: pages 157 has TWO drop-cap wrap lines at x0≈116.3 (past `body_margin + 30`), both consumed into the first body paragraph via the `in_dropcap_wrap` check (`y < 165 AND x0 > body_margin + 30`).
- Paragraph boundaries = `body_margin + 8 <= x0 <= body_margin + 20`. Body margin is computed per-page from min x0 of size-12 NewCaledonia lines (≈72 on odd pages, ≈55 on even).
- Cross-line hyphenation: current 17-prefix compound allowlist (Wave 3 final). Em-dash line-ends do not get a joining space (Wave 5 rule). Multi-hyphen compound preservation via `-[A-Za-z]+-$` regex is wired in but did not fire in this chapter.
- Top-of-page drops use the Wave 5 refined gate: `y0 < 50 AND (size <= 9.5 OR text.isdigit())` — catches both the size-9 running titles and the size-12 NewCaledonia-SC page numbers at y≈32.9.
- Bottom-of-page drops: `text.isdigit() AND y0 > 525` (covers page 157's size-9 opener page number at y≈536).
- "Chapter 10" italic label at size 12.5 on page 157 dropped via explicit regex.
- Footnote on page 171 detected by size ≤ 9 at y > 120 starting with `*`; the marker is preserved as the first character.

## Schema decisions

- **Drop-cap.** Flattened to "A" + wrap line text, no space. Two wrap lines folded into the first paragraph. No separate block for the glyph.
- **"Chapter 10" label.** Dropped per conventions.
- **Heading text.** Preserved source visual rendering "TO EMPLOYERS" (all caps). The prompt's `title` is "To Employers" (prose case), intentional divergence.
- **Narrator's first-person voice.** Pages 157–158 open with "But let him tell you:" followed by paragraphs in the employer's voice ("I was at one time assistant manager..."). Typographically these are identical to surrounding paragraphs (NewCaledonia 12pt at body column, standard first-line indent). No blockquote/verse/italics cues. Kept as ordinary `paragraph` blocks per the convention that voice alone is not a split signal.
- **Standalone one-line paragraph.** "But let him tell you:" (p003) is a genuine standalone paragraph in the source — short line ending with ":" at y=230 on page 157, followed by a visible vertical gap before the next indented paragraph at y=260. Emitted as its own block.
- **Footnote placement.** Emitted as the last block of the section (after the final body paragraph on page 170). The asterisk marker is preserved on both the referring body line (`"...straightened out.*"` in p052) and the footnote text ("* See Appendix VI..."), providing cross-reference.

## Flagged blocks

- **`ch10-to-employers-p016`** (p160) — contains `"fastthinking"` where the source reads "fast-thinking" split at the line break `"fast-"` / `"thinking"` on page 160. The prefix `fast-` is not in the 17-entry compound allowlist, so the hyphen is stripped per the conventions' default rule. This is the exact false-negative class the "ex-/re-/pre-/sub-/super-/fast-" deferred follow-up tracks. Intentionally not hot-patched per "no source-code changes" scope.
- **`ch10-to-employers-p048`** (p169→170) — text contains `"But alcoholism —well, they just don't believe they have it."`. The space before the em-dash is preserved because the em-dash sits at the START of the wrapping line (y=137.5 on p170), not the end of the previous line. Our Wave 5 em-dash rule targets em-dash-at-end-of-line joins; this case is an em-dash-at-start-of-line where a normal space-join applies. Result matches the source typography (the preceding word "alcoholism" is followed by a soft break before "—well"). Flagged for awareness only; not a bug.
- **`ch10-to-employers-p003`** (p157) — the 21-character stub "But let him tell you:". Initially looked like a misidentified split, but inspection of y-coordinates and indentation confirms the source has this as an intentionally terse single-line paragraph. Kept.
- **Cross-page merges verified visually.** No "short preceding line + terminal punctuation" that would be falsely merged. The chapter uses the standard first-line-indent pattern, so the paragraph-start detection alone resolves every page-boundary case in this section — the explicit right-margin-carryover merge was not needed.

## Schema proposals

None. All features handled by the current conventions. The `fastthinking` false-negative is a known deferred issue (Wave 4 "intra-line hyphen artifacts" note) and does not warrant a new rule here.

## Counts

| Kind      | Count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 51    |
| footnote  | 1     |
| **Total** | **53**|

Verdicts:

- Drop-cap: merged ("A" + "mong many employers nowadays, we think of " + "one member who has spent much of his life in" wrap into the first paragraph).
- Verse: none detected, none emitted.
- Footnote: one emitted on page 171 (`* See Appendix VI—We shall be happy to hear from you if we can be of help.`).
- Byline: none (chapter closes on narrative paragraph p052 + footnote).
- Table / blockquote / list-item / verse: none.
