# Structural-extractor conventions

**Date:** 2026-04-18
**Status:** Living document — updated between waves as agents surface refinements.
**Companion to:** `2026-04-18-structured-extraction-design.md`

This document is the **shared prompt material** every per-section subagent reads before starting. It locks in choices that are the same across all 68 sections so individual agents don't re-debate them, while leaving room for section-specific structural decisions.

## Library

Use **PyMuPDF** (`import pymupdf` — legacy alias `fitz`). Call `page.get_text("dict")` to obtain per-line spans with font name, font size, and bounding box. Other PyMuPDF APIs are fine as needed (e.g. `page.get_text("blocks")`, `page.get_drawings()`), but **start from** `get_text("dict")`.

`pdfplumber` is available as a secondary library in the repo venv at `.venv/`. Use it for char-level bbox info or table detection if PyMuPDF's block-level data is too coarse. Document any `pdfplumber` use in your report.

Run your Python from the venv:

```bash
/home/michelek/Documents/github/bigbook/.venv/bin/python .tmp/extract-<section-id>.py
```

Scripts under `.tmp/` are gitignored and disposable. Use them freely.

## Output

Each subagent produces exactly two files under `data/extractions/structured/`:

- `<section-id>.json` — one valid `BookSection` (see **Schema** below).
- `<section-id>.md` — freeform markdown report.

Nothing else. No source-code changes. No other JSON files.

## Schema

The structured-extraction path uses an **extended** `BookSection` / `Block` schema, documented here. It diverges from `scripts/extract-en-book/types.ts` (which is the normalize.ts pipeline's schema). When the structured path stabilizes, we'll update `types.ts` to match; until then, agents write to the extended schema below.

```typescript
interface BookSection {
  id: string
  kind:
    | 'front-matter'
    | 'preface'
    | 'foreword'
    | 'doctors-opinion'
    | 'chapter'
    | 'story'
    | 'appendix'
  title: string
  parentGroup?: string
  pdfPageStart: number
  pdfPageEnd: number
  bookPageStart: number
  bookPageEnd: number
  blocks: Block[]
}

interface Block {
  id: string
  kind: BlockKind
  text: string
  pdfPage: number
  rows?: string[][] // only present when kind === 'table'
}

type BlockKind =
  | 'heading'
  | 'paragraph'
  | 'blockquote'
  | 'verse'
  | 'list-item'
  | 'footnote'
  | 'table' // added 2026-04-18 via Wave 1 ch05 agent proposal
  | 'byline' // added 2026-04-18 via Wave 1B ch01 agent proposal
```

Section metadata (id, kind, title, page ranges, parentGroup) is handed to you in your prompt — do not re-derive it. **Note:** the `title` field in your prompt is the canonical prose-case form ("Bill's Story"); the `heading` block's text should preserve the source's visual rendering ("BILL'S STORY"). This divergence is intentional — `title` is metadata, the heading block is authored content.

## Block id scheme

`<section-id>-<prefix><NNN>` where:

- `<section-id>` is the kebab-case section id handed to you.
- `<prefix>` is a **per-kind single-letter prefix**:
  - `h` — heading
  - `p` — paragraph
  - `l` — list-item
  - `q` — blockquote
  - `v` — verse
  - `f` — footnote
  - `t` — table
  - `b` — byline
- `<NNN>` is a **continuous** zero-padded 3-digit ordinal across the whole section. No per-kind restart. Example: if the first block is a heading (`h001`), a paragraph (`p002`), and then a list-item (`l003`), the next block is `p004` regardless of kind.

## What to emit vs drop

### Drop entirely

- **Page numbers at top or bottom of page** (the numeric-only running elements). These are layout artifacts, not content.
- **Running title headers** — "HOW IT WORKS" at the top of every page, "ALCOHOLICS ANONYMOUS" at the top of alternate pages, etc. Detectable by small font size (typically 9pt in this PDF) **AND** position near page top (`y0 < 50`). **Important — do NOT drop by `y0 < 50` alone.** Front-matter sections (Preface, Foreword, Doctor's Opinion) have no running headers; their section title sometimes sits in that y-zone at full heading size. Combine `y0 < 50` with a font-size check (`size <= 9.5`) before dropping.
- **Running page numbers** appear at `y0 < 50` alongside the running title. Some render at small font size (9pt), but many render at **body-text size 12pt** in NewCaledonia-SC. The `size <= 9.5` gate alone misses these — they leak into body paragraphs as mid-sentence digits (`"...if we 74 expect to live..."`). Drop when `y0 < 50` AND EITHER `size <= 9.5` OR the text is all digits (`text.strip().isdigit()`). This pattern affects chapters and stories; front-matter pages often have no page numbers.
- **"Chapter N" labels** (e.g. "Chapter 5"). Redundant with the section's position in the outline. **Do NOT emit as a heading block.** The chapter's semantic heading is the chapter title ("How It Works"), not the label.
- **Print-production annotations** — `Alco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page N` lines. pdftotext surfaces these; they may or may not appear in your structured extraction. Drop on sight.
- **Form-feed / page-break control characters**.

### Emit

- **Chapter/story/appendix title** — the "real" heading the reader sees. Emit as a `heading` block. Example: "HOW IT WORKS", "BILL'S STORY". **Appendix titles span two centered lines** — the roman numeral (`I`, `II`, `III`, ...) on line 1, and the title text on line 2 (e.g. `THE A.A. TRADITION`). Merge both into a single `heading` block, joined by a space: `I THE A.A. TRADITION`, `II SPIRITUAL EXPERIENCE`. Any parenthesized disambiguator (e.g. `(The Long Form)`) on a following centered line at heading font-size merges into the same heading text: `The Twelve Traditions (The Long Form)`. **Heading may be absent.** Some front-matter pages have no visible heading (copyright-info on page 1 is pure content with no title element). When no heading is detectable, omit the `heading` block entirely — don't synthesize one from the section `title` metadata. Downstream consumers of `BookSection.blocks` must tolerate sections where the first block is not `kind: "heading"`.
- **Subtitles** accompanying story titles (the italic "deck" beneath, e.g. "She hid her bottles in clothes hampers..."). **Default:** emit as a single `paragraph` block (join all deck lines). **Exception:** when the italic deck shows multiple clear first-line indents (a structured multi-paragraph description), emit one `paragraph` block per indented group. Agent's call; document in `.md`.
- **Story-number prefix** `(N)` (decorative story numbering in Parts II/III). **Do NOT emit as its own block.** If it is visually merged with the title line, decide whether to include it in the heading text or drop it from the title. Lean toward DROP — it is structural numbering, not authored content. Document your choice in `.md`.
- **Body prose** as `paragraph` blocks, one block per paragraph. Paragraph boundary = first-line indent beyond the body margin. Collapse internal newlines to single spaces.
- **Numbered or lettered lists** as `list-item` blocks, one block per item. Join hanging-indent continuations into the same list-item block. Known cases: the Twelve Steps in ch05 (numeric `1.`-`12.`), the Twelve Traditions in appendix-i (word `One-`-`Twelve-`), the Twelve Concepts in appendix-vii (roman `I.`-`XII.`), and the `(a)(b)(c)` sub-lists in ch05.
- **Quoted verse** as `verse` blocks, preserving internal newlines (unlike paragraphs). Detection signals: consistent line length < 50 chars, shared x-coordinate (often center-indented), clear start and end via opening/closing quotes or surrounding blank lines. Known true verse: the **Hampshire Grenadier tombstone** in ch01-bills-story ("Here lies a Hampshire Grenadier / Who caught his death / Drinking cold small beer. / A good soldier is ne'er forgot / Whether he dieth by musket / Or by pot."). Err on the side of NOT emitting verse when the signal is ambiguous — prior pipelines had over-detection problems.
- **Tables** as `table` blocks. Put the reconstructed rows in the optional `rows: string[][]` field AND serialize to `text` as pipe-and-newline (`" | "` between cells, `"\n"` between rows) so non-table-aware consumers get a readable fallback. Known case: the resentment-inventory table in ch05 (pages 86-87).
- **Footnotes** as `footnote` blocks. Detectable by the `*` or `†` marker at the start of the first line. Preserve the marker as the first character of the footnote text so it cross-references the paragraph it annotates.
- **Bylines / author attributions** as `byline` blocks. These appear at the end of most personal stories (e.g. `Bill W., co-founder of A.A., died January 24, 1971.` at the end of ch01, or the `-- Joe M.` style sign-off at the end of many Part II / Part III stories), **at the end of signed letters** in front-matter (e.g. Dr. Silkworth's two letters in The Doctor's Opinion each close with `Very truly yours, / William D. Silkworth, M.D.`), **and as epigraph attributions** — right-aligned author credits after a quoted epigraph (e.g. `—Herbert Spencer` after the Spencer quote in appendix-ii-spiritual-experience). A byline is typographically distinct from a body paragraph (short, italic or small-caps, no first-line indent, often right-aligned or tab-indented) and is metadata about the author, not narrative prose. **Multi-line byline join:** when a closing phrase (`Very truly yours,` / `Sincerely,`) is on one line and the signatory name is on the next, join them into a single `byline` block with `", "` as the separator — not two separate blocks, not `"\n"`.
- **Blockquotes** as `blockquote` blocks. Reserve this kind for **editorial interludes or inset passages** — passages typographically distinct from the surrounding narrative: smaller font, a different indent column, and often bracketed by parenthetical stage-direction text (e.g. `(The Editors interrupt to add...)`). Known case: the Bill W. editorial interlude on pp. 203-204 of story-aa-number-three, where the Editors hand narration to Bill W.'s first-person account, then hand it back. Emit one `blockquote` per in-deck paragraph. **Do NOT** use `blockquote` for ordinary dialogue, pull-quotes, or italicized prayers — those stay in their surrounding `paragraph`.

### Emit with care

- **Dialogue passages in prose** — keep them inside their surrounding `paragraph` block. Dialogue is NOT `verse` or `blockquote`; the fact that lines start with an opening `"` is not sufficient signal.
- **Italicized pull-quotes within prose** (e.g. the Third Step Prayer in ch05). Kept inline with the surrounding paragraph is the current precedent — italics alone is a weak split signal. If you split one out, document why.
- **Drop-caps.** The oversized first letter (often a different font like ParkAvenue) should be merged into the first word of the first paragraph, not emitted as its own block. The "W" in "W ar" becomes "W" + "ar" = "War" (no space). The surrounding small-caps tail, if any, is flattened to regular case. **Post-flatten pronoun capitalization:** the small-caps glyph for pronoun `I` renders as lowercase `i` after flattening. Apply `\bi\b → I` to the merged drop-cap-and-tail text so the opening reads `"When I was eight"` not `"When i was eight"`. Observed in missing-link.

## Text normalization

- **Ligatures** — U+FB01 `ﬁ` → `fi`, U+FB02 `ﬂ` → `fl`, U+FB03 `ﬃ` → `ffi`, U+FB04 `ﬄ` → `ffl`, U+FB05 `ﬅ` → `st`, U+FB00 `ﬀ` → `ff`. Normalize to ASCII digraphs.
- **NUL byte `\x00`** — strip. PyMuPDF occasionally emits a NUL after drop-cap glyphs (observed in women-suffer-too: `W\x00`). Always strip `\x00` at normalization time.
- **Soft hyphens** (`U+00AD`) — strip.
- **Curly quotes** — PRESERVE. Do not flatten curly `"` / `"` / `'` / `'` to ASCII. These appear in the source text and are part of the authored content.
- **Em-dash** `—` — preserve. **Important — do NOT insert a space when joining across a line break after an em-dash.** The cross-line join rule is for hyphens; em-dashes at line-end are part of the preceding word/phrase (`people—` + `was` → `people—was`, not `people— was`). Check the line's last character before deciding to insert a join-space; only insert for regular line-end joins where the previous line does NOT end in `-` or `—`.
- **En-dash** `–` — preserve.
- **Cross-line hyphenation** — when a line ends with `-` AND the next line begins with a lowercase letter AND the split appears to be mid-word (not an em-dash context, not a list-item prefix), strip the `-` and join the lines without inserting a space. **Exception — preserve compound-word hyphens.** Keep the hyphen when the joined result is a legitimate compound. Maintain a narrow allowlist of compound prefixes: `self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`, `pseudo-`, and the small-number prefixes `one-`, `two-`, `three-`, `four-`, `five-`, `six-`, `seven-`, `eight-`, `nine-`, `ten-`, and the ordinal-decade prefixes `twenty-`, `thirty-`, `forty-`, `fifty-`, `sixty-`, `seventy-`, `eighty-`, `ninety-` (for fractions like `one-half` and compounds like `four-fold` or `twenty-third`). When the string preceding the line-end `-` matches one of these, keep the hyphen AND join the lines without inserting a space (no `self- pity` or `one- half`). **Do NOT include `re-`, `pre-`, `sub-`, `super-`, `ex-`** — these produce false positives on common body-prose words (`remember`, `return`, `prepare`, `submit`, `supply`, `experiences`, `explanation`) that overwhelmingly outnumber genuine compounds. **Number-prefix qualification:** the number prefixes (`one-` through `ten-` and `twenty-` through `ninety-`) keep the hyphen only when the following line's first word is a known fraction or number-compound tail (`half`, `third`, `quarter`, `fold`, `year`, `day`, `sided`, `degree`, `dollar`, `bit`). Otherwise strip — this correctly joins `nine-` + `teen` → `nineteen` but preserves `twenty-` + `third` → `twenty-third`.
- **Capitalized-stem hyphen preservation** — orthogonal to the lowercase allowlist. If the string preceding the line-end `-` starts with an uppercase letter (e.g. `God-`, `Anglo-`, `Franco-`, `Judeo-`), keep the hyphen. Capitalized stems are proper-noun halves of compounds; the false-positive risk is low because most capitalized words appear at sentence starts and don't end in `-`. Observed: `God-consciousness` (appendix-ii).
- **Multi-hyphen compounds at line breaks** — compounds with three-plus hyphenated parts (`life-and-death`, `face-to-face`, `ten-dollar-a-week`) can split at the middle hyphen, and the middle word (`and`, `to`) is never in the allowlist. Extra rule: if the out-buffer already ends with `<hyphen><word><hyphen>$` (regex `-[A-Za-z]+-$`) when a cross-line `-` join is being considered, preserve the trailing hyphen regardless of the allowlist. This catches multi-hyphen compounds cleanly without widening the allowlist.

## Heuristics known useful

Seeded from Wave 1 ch05 and refined across Waves 1B–4. Agents are free to adapt per section.

- **Body font is size ~12.0 in chapter/story bodies** (NewCaledonia). **Front-matter body font is ~10.98** (smaller). Headings are typically **≥13.0** (13.5 in chapters, 14.0 in Preface, 13.0 in Doctor's Opinion — do not gate heading detection on exact 13.5). Running headers/footers are 9.0. Resentment-table body is 11.0. Chapter label ("Chapter N") is 12.5 italic.
- **Body left margin alternates by page parity** — odd pages ≈ col 69, even pages ≈ col 52. Paragraph-start indent is +12 pts past the body margin. Front-matter and other sections may have different body margins — infer per section.
- **Running headers are at `y0 < 50`** AND at small font-size (≤9.5). Do not drop by y alone.
- Drop caps are in **ParkAvenue font at ~51pt** in chapters/stories, **~18pt for small lead-in caps** in front-matter (e.g. Preface's `T` + `HIS IS `, Doctor's Opinion's `WE OF` two-word lead-in). Merge drop-cap with the body remainder; flatten any small-caps tail to regular case. **PyMuPDF layout variant:** the drop-cap glyph and the first body text chunk sometimes share a single text-"line" in PyMuPDF's output (observed in story-the-vicious-cycle); in those cases the drop-cap-plus-body text is already pre-joined in PyMuPDF's `text` field and the merge is a no-op. Don't assume "drop-cap is on its own line" — handle both layouts.
- **Superscript fractions** — fractions like `1⁄2` render as the host body line (`1⁄` at body size) plus a separate tiny line (`2` at ~6pt) sitting on the same y-band. Fold by: walk lines, detect any line with `size ≤ 7.0` whose bbox y-center falls inside a larger host line's y-span AND whose x overlaps the host — splice its text into the host right after the `⁄` (U+2044) character. Result: `2 1⁄2 years`. Observed in story-the-keys-of-the-kingdom.
- **Letter-spaced heading numerals** — PyMuPDF sometimes emits a heading's roman-numeral prefix with interior spaces (observed: `V I I ` as three glyphs plus trailing space in appendix-vii). Collapse `re.sub(r"\s+", "", numeral_line)` before joining into the merged heading text: `VII THE TWELVE CONCEPTS (Short Form)`.
- **Facsimile pages** — page 4 (Foreword to First Edition) is a reduced-scale facsimile of the 1939 original. Its heading AND body are set at ~9pt. The `>= 13.0` heading rule and the `size <= 9.5` running-header rule both misfire here. Handle by **text-match heading detection first** (match against `title` or its visual ALL-CAPS form), then exclude the matched heading from the running-header-drop candidate set. This is the only known facsimile in the book, but the workaround is defensive against future surprises.

### Cross-page paragraph merge

PyMuPDF's block extraction starts a new block on each new page, which artificially splits paragraphs that wrap across a page boundary. Apply a **post-pass merge** with two signals, in order:

1. **Right-margin carry-over** (works for sections with first-line paragraph indents): if the earlier block's last line's `x1` reaches near the right margin (roughly `> 280pt` on a `~396pt` content width), the paragraph probably continues onto the next page — merge.
2. **Terminal-punctuation heuristic** (works for front-matter sections with no first-line indent): if the earlier block's last line ends with `.`, `!`, `?`, `:`, or a closing quote, the paragraph is complete — start a new paragraph on the next page. Otherwise, continuation — merge.

Both heuristics have been verified on Wave 4 outputs (preface, foreword-2nd-edition, doctors-opinion). Use whichever matches your section's layout; document the choice in `.md`.

## Report content

Your `<section-id>.md` report should contain (brief sections are fine):

1. **Summary** — one paragraph: what section, how many blocks emitted, any high-level issues.
2. **Method** — which PyMuPDF APIs you called, which heuristics fired.
3. **Schema decisions** — any choice that wasn't mandated by this doc (e.g. how you handled the drop-cap, how you split a subtitle, whether you preserved the story-number).
4. **Flagged blocks** — specific block ids where you were uncertain, with a quoted snippet.
5. **Schema proposals** — if anything in this conventions doc doesn't fit cleanly, say so. Accepted proposals are added to this doc before later waves.

## Hard constraints (repeated)

- No source-code modifications. Only write to `data/extractions/structured/` and `.tmp/`.
- No commits, no pushes, no npm.
- One section per subagent.
- JSON must parse.

## Evolution log

- **2026-04-18 (Wave 1 ch05 pilot, discarded per PO decision to re-pilot with new conventions)** — proposals accepted:
  - Per-kind id prefix scheme (`h`/`p`/`l`/`q`/`v`/`f`).
  - Suppress "Chapter N" label blocks (do not emit).
  - Add `table` to `BlockKind`.
  - Keep Third-Step-Prayer-style italic pull-quotes inline with paragraph (do not split on italics alone).
- **2026-04-18 (Wave 1B ch01-bills-story pilot, accepted)** — proposals accepted:
  - Add `byline` to `BlockKind` (prefix `b`) for author-attribution sign-offs at the end of stories.
  - Compound-word allowlist for cross-line hyphenation (keep `self-`, `well-`, `co-`, `non-`, `ex-`, `re-`, `pre-`, `semi-`, `anti-`, `sub-`, `super-`, `multi-` as hyphenated; strip others).
  - Document intentional divergence between section `title` (prose-case, metadata) and `heading` block text (visual rendering, content).
  - Preserve footnote marker (`*` or `†`) as the first character of the footnote text for cross-reference.
- **2026-04-18 (Wave 1B ch01-bills-story pilot, deferred)**:
  - Optional `marker?` / `references?` field linking footnote to in-text reference point. Current scheme (leading `*` in the footnote text) is sufficient for ch01's single footnote; revisit if a section has multiple footnotes on the same page.
- **2026-04-18 (Wave 2 ch08 + story-gratitude, accepted)**:
  - Narrow the compound-word hyphen allowlist from 12 to 8 prefixes (drop `re-`, `pre-`, `sub-`, `super-`). Flagged by Gratitude agent: body prose has `remember`, `return`, `prepare`, etc. overwhelmingly outnumbering genuine `re-emerged`-style compounds. Keep only the narrow set: `self-`, `well-`, `co-`, `non-`, `ex-`, `semi-`, `anti-`, `multi-`.
  - Drop-cap merge for stories differs from chapters: in stories the drop-cap glyph sits AT the body margin (not inside it), and adjacent body lines wrap-indent around it. The merge rule is unchanged — single letter + rest of first word → joined. When the drop-cap is a standalone single-letter word like `I` followed by a complete separate word (`I believe`), insert a space. When it's the first letter of a word continued on the next line (`W` + `ar` → `War`), no space.
- **2026-04-18 (Wave 3 dr-bobs + ch02 + appendix-i, accepted)**:
  - Drop `ex-` from the compound-word hyphen allowlist. ch02 agent found 2 false positives (`experiences`, `explanation`) and 0 genuine `ex-`-compound cross-line splits. Current allowlist: 7 prefixes (`self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`).
  - Add `so-` to the allowlist. ch02 needed this for `so-called` (`socalled` was emitted without it).
  - Add small-number prefixes `one-` through `ten-` to the allowlist. dr-bobs needed `one-` for `one-half`; the whole set is a natural cohort.
  - Final allowlist: `self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`, `one-`, `two-`, `three-`, `four-`, `five-`, `six-`, `seven-`, `eight-`, `nine-`, `ten-`.
  - Soften the "subtitle → single paragraph block" default: when the italic deck shows multiple clear first-line indents, emit one paragraph per indented group. dr-bobs's 11-line 3-paragraph italic deck honored source typography.
  - Document the appendix "roman-numeral on line 1 + title on line 2" centered heading pattern: merge into one heading block joined by space (`I THE A.A. TRADITION`). Parenthesized disambiguators on a following line merge too.
- **2026-04-18 (Wave 3 dr-bobs, noted)**:
  - Latent bug in the Wave 2 Gratitude extraction script (`extract-story-gratitude.py`): when `keep_hyphen` is true in `join_paragraph_lines`, the branch falls through and inserts a space (`one- half`). Wave 2 output unaffected (no compound splits in Gratitude). Each subagent writes its own script, so this is not a shared-code defect — noting here for awareness. If a future wave uses the Wave 2 script as a template, review the join logic.
- **2026-04-18 (Wave 4 ch11 + aa-three + preface + foreword-2nd + doctors-opinion, accepted)**:
  - Document cross-page paragraph merge heuristics in "Heuristics known useful": (1) right-margin carry-over for indented sections, (2) terminal-punctuation for front-matter sections with no first-line indent. Both verified on Wave 4 outputs.
  - Qualify the `y0 < 50` running-header drop rule: require `AND size <= 9.5`. Front-matter sections (Preface, Doctor's Opinion) have their section title in that y-zone at full heading size; dropping by y alone would kill the heading.
  - Relax heading font-size heuristic from exact `== 13.5` to `>= 13.0`. Preface uses 14.0, Doctor's Opinion uses 13.0, chapters use 13.5.
  - Document small lead-in caps (ParkAvenue ~18pt) as a front-matter drop-cap variant distinct from the chapter/story ~51pt single-letter drop-cap. Preface: `T` + `HIS IS ` (small-caps tail flattened). Doctor's Opinion: `WE OF` (two-word lead-in). Merge rules unchanged — join with body remainder, flatten small-caps to regular case.
  - Formalize `blockquote` use for editorial interludes (first appearance: story-aa-number-three pp203-204 Bill W. interlude). Signature: smaller font + own indent column + parenthetical "stage-direction" brackets. Emit one `blockquote` per in-deck paragraph. Reserve the kind for this pattern — do NOT use for dialogue, pull-quotes, or italicized prayers.
  - Broaden `byline` description to include signed letters (Doctor's Opinion has two Silkworth signatures). Multi-line byline join: closing phrase + name → single `byline` with `", "` separator (not two blocks, not `"\n"`).
- **2026-04-18 (Wave 4, deferred)**:
  - **Intra-line hyphen artifacts** — source PDF contains single-line tokens like `suc-ceeded`, `contin-ued`, `Catho-lics`, `ex-periences`, `ex-planation`, `exproblem`, `socalled` that are not cross-line breaks (the current cross-line rule doesn't fire). These need a separate post-reassembly normalization pass with a word-level dictionary or allow/deny list. Observed in ch02, foreword-2nd-edition, doctors-opinion. Deferred — outside per-agent scope. Open follow-up issue if needed.
- **2026-04-18 (Wave 5 ch03 + ch04 + ch06 + women-suffer-too + our-southern-friend + vicious-cycle + foreword-1st + appendix-iii, accepted)**:
  - **Running page-number drop rule refinement:** at `y0 < 50`, drop EITHER by `size <= 9.5` OR by `text.strip().isdigit()`. The old `size <= 9.5` gate missed 12pt page numbers (ch06 would have produced `"...if we 74 expect to live..."` before the fix). Plantin audit confirmed no prior-wave output was actually leaked — bug was caught in-script — but the conventions rule needed tightening so Wave 6+ agents don't reintroduce it.
  - **Em-dash line-join fix:** do NOT insert a space when joining across a line where the previous line ends with `—`. Current code inserted `people— was` instead of `people—was`. ch04 flagged 4 instances of `p004`, `p028`, `p043`, `p048`; ch04 output kept as-is (cosmetic, not structural); rule documented for Wave 6+.
  - **Multi-hyphen compound preservation:** if the out-buffer already ends with regex `-[A-Za-z]+-$` when a cross-line `-` join is being considered, preserve the trailing hyphen regardless of the allowlist. Catches `life-and-death`, `face-to-face`, `ten-dollar-a-week` etc. without widening the prefix allowlist.
  - **NUL-byte normalization:** strip `\x00` at text normalization time. PyMuPDF emits this after some drop-cap glyphs (women-suffer-too: `W\x00`).
  - **Facsimile-page caveat:** page 4 (Foreword to First Edition) is a reduced-scale 1939 reproduction where both heading and body are ~9pt. The usual heading-size and running-header rules both misfire. Handle by text-match heading detection first, then exclude the matched heading from running-header drop candidates. Documented as the only known facsimile in the book, but the workaround is defensive.
  - **Drop-cap layout variant:** PyMuPDF occasionally emits the drop-cap glyph and the first body text chunk as a single text-"line" (vicious-cycle observed this). Extraction scripts must handle both "drop-cap alone on its line" and "drop-cap + body pre-joined" layouts.
  - **Verse discipline win (no conventions change):** our-southern-friend had 5 verse candidates (scripture quote, song titles, italic inner-voice, prayer dialogue, short dialogue turns). Agent emitted 0 verses and documented each decision with a rationale. Prior pipelines emitted 7 verses here; the "short + shared-x + blank-surround" rule held up under stress. This is the pattern to preserve in future waves.
- **2026-04-18 (Wave 6 ch07/09/10 + copyright + foreword-3rd/4th + appendix-ii/vii + 5 Part II stories, accepted)**:
  - **Compound-hyphen allowlist extensions**: add `pseudo-` (keys-of-the-kingdom: `pseudo-sophistication`); add ordinal-decade prefixes `twenty-` through `ninety-` (jims-story: `twenty-third`). Full allowlist now: `self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`, `pseudo-` + `one-`..`ten-` + `twenty-`..`ninety-`.
  - **Number-prefix qualification**: number-prefix allowlist entries keep the hyphen only when the following word is a known fraction or compound tail (`half`, `third`, `quarter`, `fold`, `year`, `day`, `sided`, `degree`, `dollar`, `bit`). Fixes false positive `nine-teen → nine-teen` (should be `nineteen`) flagged by man-who-mastered-fear. Correct behavior: `nine-` + `teen` → `nineteen`; `twenty-` + `third` → `twenty-third`.
  - **Capitalized-stem hyphen preservation**: orthogonal to the lowercase-prefix allowlist. If the stem before line-end `-` starts with an uppercase letter (`God-`, `Anglo-`, `Franco-`, `Judeo-`), preserve the hyphen. appendix-ii proposed this for `God-consciousness`.
  - **Byline extended to epigraph attributions**: right-aligned author credits after a quoted epigraph (`—Herbert Spencer` in appendix-ii). Same typographic signature as story sign-offs.
  - **Small-caps pronoun `I` post-flatten**: apply `\bi\b → I` to the merged drop-cap-and-tail text after flattening small-caps. Missing-link's opening would have emitted `"When i was eight"`; the fix produces `"When I was eight"`.
  - **Superscript fraction fold**: detect size ≤ 7pt lines whose bbox y sits inside a host line's y-span and x overlaps; splice after the `⁄` (U+2044) character. keys-of-the-kingdom's `2 1⁄2 years` required this.
  - **Letter-spaced heading numerals**: PyMuPDF emits some roman-numeral heading lines with interior spaces (`V I I ` in appendix-vii). Collapse whitespace before joining into the merged heading text.
  - **Missing-heading sections**: some sections (copyright-info) have no visible heading element. Omit the `heading` block entirely — do not synthesize. Downstream consumers of `BookSection.blocks` must tolerate `blocks[0].kind != "heading"`. First known instance: copyright-info.
  - **Three-line heading support**: appendix-vii has three centered heading lines (`VII` / `THE TWELVE CONCEPTS` / `(Short Form)`). Already implicit in the Wave 3 "parenthesized disambiguator merges too" rule; documented explicitly here.
- **2026-04-18 (Wave 6, deferred)**:
  - **`pay-` and `fast-` compound hyphens**: `pay-day → payday` (jims-story), `fast-thinking → fastthinking` (ch10). Unlike `pseudo-` these have legitimate single-word forms (`payday`, `fasthinking` might read as a sports metaphor). Source is inconsistent. Defer — requires a lexical dictionary or per-section judgment that a narrow allowlist can't settle.
  - **`witch-` prefix in `witchburners` (ch07)**: same class. Defer.
  - **Semantic-slogan grouping** (ch09's three closing mottoes `First Things First / Live and Let Live / Easy Does It.`): currently emitted as three `paragraph` blocks. Could be a `motto` or `aphorism` kind if pattern recurs. Defer — revisit only if Wave 7/8 surfaces similar constructs.
