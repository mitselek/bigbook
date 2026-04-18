# appendix-ii-spiritual-experience — extraction report

## Summary

Wave 6 per-section extraction for Appendix II, "Spiritual Experience" (pp. 572–573). Emitted 10 blocks: 1 heading, 8 paragraphs, 1 byline. Pure prose appendix plus a closing Herbert Spencer epigraph with right-aligned attribution. Cross-page paragraph continuation from p572 to p573 was merged successfully. One in-paragraph compound hyphen (`God-consciousness`) needed a small rule extension beyond the shared allowlist.

## Method

- PyMuPDF `get_text("dict")` for per-line spans with font/size/bbox.
- No `pdfplumber`.
- Heading detection: two centered lines on p572 at y≈45 and y≈74, size ≥ 12.5. Merge as roman + space + title, stripping interior spaces from the PyMuPDF-rendered roman numeral (source is `"I I "` → `"II"`).
- Paragraph splitter: within-page y-gap > 20pt (measured within-paragraph gap ≈ 13.3pt; between-paragraph gap ≈ 27.3pt).
- Cross-page merge: terminal-punctuation heuristic (conventions §"Cross-page paragraph merge", signal 2). p572's last line ends `"…which they"` (no terminal punctuation, lowercase), p573's first line begins `"presently identify…"` (lowercase) → merged.
- No running headers or page numbers on these appendix pages (defensive drop guards retained in the script; none fired).
- No ligatures, soft hyphens, or NUL bytes observed.

## Schema decisions

1. **Heading two-line merge.** Roman numeral `I I` (from PyMuPDF's span; two glyphs with a space) is normalized to `II` before joining with the title. Final heading text: `II SPIRITUAL EXPERIENCE`. Matches the conventions pattern (`II SPIRITUAL EXPERIENCE` is explicitly listed as the canonical example in the conventions doc).
2. **Herbert Spencer epigraph attribution → `byline` (`b010`).** The quote body (`"There is a principle…"`) is emitted as a `paragraph` (`p009`) — it sits at the body margin x=63, full-width, 10.98pt, same font family as the surrounding prose. The attribution `—Herbert Spencer` is typographically distinct: x=245 (right-aligned, not at body margin), its own line, 27.5pt gap above, leading em-dash, ArialMT-rendered em-dash. It fits the conventions `byline` signature ("typographically distinct from a body paragraph … often right-aligned … metadata about the author, not narrative prose"). The conventions' stated examples are story sign-offs and signed letters; an epigraph attribution is a new sub-case but shares the same typographic fingerprint. Flagged for Plantin review — see **Schema proposals** below.
3. **Italic closing clause in `p008`.** The last two lines of the "We find that no one need…" paragraph (`mindedness are the essentials of recovery. But these are indispensable.`) render in `NewCaledonia-Italic`. Per conventions, italics alone is a weak split signal; no indent change, no font-size change. Kept inline with the surrounding paragraph.
4. **Quote opening `"` in ArialMT.** On p573 the first glyph of `p009` (the curly opening double quote) renders in `ArialMT` rather than `NewCaledonia`. This is a rendering artifact (missing glyph in body font?), not a structural signal. Kept as a single paragraph.
5. **`God-consciousness` compound preservation.** The cross-line split `"God-"` + `"consciousness"` on p572 is not covered by the conventions' compound-word allowlist (`self`, `well`, `co`, `non`, `semi`, `anti`, `multi`, `so`, `one`–`ten`). Applying the allowlist rule as-is would strip the hyphen and emit `Godconsciousness`, which is wrong — the same compound appears intact on p573 as `"God-consciousness."`. Added a narrow section-local rule: when the stem word before a line-end `-` starts with an uppercase letter (proper-noun signal), preserve the hyphen. This matches the single occurrence here and does not fire on any other line in the section. Flagged for Plantin review — see **Schema proposals** below.

## Flagged blocks

- `b010` — byline for Herbert Spencer attribution. First epigraph attribution in the corpus so far; conventions-stretching. Text: `—Herbert Spencer`.
- `p004` — contains `"God-consciousness"` across a line break. Relied on the new "capitalized-stem preserves hyphen" rule. Snippet: `…acquire an immediate and overwhelming "God-consciousness" followed at once by a vast change in feeling and outlook.`
- `p005` — cross-page paragraph merge. Ends `"…their own conception of a Power greater than themselves."` on p573 even though `pdfPage=572` (first line's page). Convention allows this (block `pdfPage` = starting page).
- `p008` — italic closing phrase (`NewCaledonia-Italic`) kept inline. Snippet: `We find that no one need have difficulty with the spirituality of the program. Willingness, honesty and open mindedness are the essentials of recovery. But these are indispensable.`
- `p009` — quoted epigraph paragraph. Emitted as a plain `paragraph`, not `blockquote`, because the typography does not match the conventions' `blockquote` signature (no smaller font, no distinct indent, no parenthetical "stage direction" markers). Snippet: `"There is a principle which is a bar against all information…"`.

## Schema proposals

1. **Epigraph attribution as `byline`.** Document that `byline` includes **epigraph / pull-quote attribution lines** at the close of a section, alongside the existing cases (story sign-offs, signed letters). Signature: typographically distinct, short, right-aligned or tab-indented, starts with an em-dash or dashed-name form, attribution is to a quoted source not to the section author. This is the first occurrence in Waves 1–6; a later wave might find more (e.g. other appendices with epigraphs). If Plantin prefers, an alternative is to introduce a new `attribution` kind distinct from `byline` — though the typographic fingerprint is identical, so a new kind would be cosmetic.
2. **Proper-noun stem preserves cross-line hyphen.** Extend the conventions' cross-line hyphenation rule: when the stem word before `-` starts with an uppercase letter, preserve the hyphen even if the stem is not in the compound-prefix allowlist. Rationale: proper-noun compounds (`God-consciousness`, `Anglo-Saxon`, `Judeo-Christian`) are compound by virtue of the proper-noun component and do not fit into the `self-/well-/…` prefix allowlist model. The allowlist is a lowercase-prefix concept; a capitalized-stem gate is a natural orthogonal signal with low false-positive risk (a capitalized word at line end followed by a lowercase continuation is almost always a mid-compound break, not a cross-line split of a single all-lowercase word).
