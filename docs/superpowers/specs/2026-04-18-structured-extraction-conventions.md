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
- **Running title headers** — "HOW IT WORKS" at the top of every page, "ALCOHOLICS ANONYMOUS" at the top of alternate pages, etc. Detectable by small font size (typically 9pt in this PDF) and position near page top (`y0 < 50`).
- **"Chapter N" labels** (e.g. "Chapter 5"). Redundant with the section's position in the outline. **Do NOT emit as a heading block.** The chapter's semantic heading is the chapter title ("How It Works"), not the label.
- **Print-production annotations** — `Alco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page N` lines. pdftotext surfaces these; they may or may not appear in your structured extraction. Drop on sight.
- **Form-feed / page-break control characters**.

### Emit

- **Chapter/story/appendix title** — the "real" heading the reader sees. Emit as a `heading` block. Example: "HOW IT WORKS", "BILL'S STORY". **Appendix titles span two centered lines** — the roman numeral (`I`, `II`, `III`, ...) on line 1, and the title text on line 2 (e.g. `THE A.A. TRADITION`). Merge both into a single `heading` block, joined by a space: `I THE A.A. TRADITION`, `II SPIRITUAL EXPERIENCE`. Any parenthesized disambiguator (e.g. `(The Long Form)`) on a following centered line at heading font-size merges into the same heading text: `The Twelve Traditions (The Long Form)`.
- **Subtitles** accompanying story titles (the italic "deck" beneath, e.g. "She hid her bottles in clothes hampers..."). **Default:** emit as a single `paragraph` block (join all deck lines). **Exception:** when the italic deck shows multiple clear first-line indents (a structured multi-paragraph description), emit one `paragraph` block per indented group. Agent's call; document in `.md`.
- **Story-number prefix** `(N)` (decorative story numbering in Parts II/III). **Do NOT emit as its own block.** If it is visually merged with the title line, decide whether to include it in the heading text or drop it from the title. Lean toward DROP — it is structural numbering, not authored content. Document your choice in `.md`.
- **Body prose** as `paragraph` blocks, one block per paragraph. Paragraph boundary = first-line indent beyond the body margin. Collapse internal newlines to single spaces.
- **Numbered or lettered lists** as `list-item` blocks, one block per item. Join hanging-indent continuations into the same list-item block. Known cases: the Twelve Steps in ch05 (numeric `1.`-`12.`), the Twelve Traditions in appendix-i (word `One-`-`Twelve-`), the Twelve Concepts in appendix-vii (roman `I.`-`XII.`), and the `(a)(b)(c)` sub-lists in ch05.
- **Quoted verse** as `verse` blocks, preserving internal newlines (unlike paragraphs). Detection signals: consistent line length < 50 chars, shared x-coordinate (often center-indented), clear start and end via opening/closing quotes or surrounding blank lines. Known true verse: the **Hampshire Grenadier tombstone** in ch01-bills-story ("Here lies a Hampshire Grenadier / Who caught his death / Drinking cold small beer. / A good soldier is ne'er forgot / Whether he dieth by musket / Or by pot."). Err on the side of NOT emitting verse when the signal is ambiguous — prior pipelines had over-detection problems.
- **Tables** as `table` blocks. Put the reconstructed rows in the optional `rows: string[][]` field AND serialize to `text` as pipe-and-newline (`" | "` between cells, `"\n"` between rows) so non-table-aware consumers get a readable fallback. Known case: the resentment-inventory table in ch05 (pages 86-87).
- **Footnotes** as `footnote` blocks. Detectable by the `*` or `†` marker at the start of the first line. Preserve the marker as the first character of the footnote text so it cross-references the paragraph it annotates.
- **Bylines / author attributions** as `byline` blocks. These appear at the end of most personal stories (e.g. `Bill W., co-founder of A.A., died January 24, 1971.` at the end of ch01, or the `-- Joe M.` style sign-off at the end of many Part II / Part III stories). A byline is typographically distinct from a body paragraph (short, italic or small-caps, no first-line indent) and is metadata about the author, not narrative prose.

### Emit with care

- **Dialogue passages in prose** — keep them inside their surrounding `paragraph` block. Dialogue is NOT `verse` or `blockquote`; the fact that lines start with an opening `"` is not sufficient signal.
- **Italicized pull-quotes within prose** (e.g. the Third Step Prayer in ch05). Kept inline with the surrounding paragraph is the current precedent — italics alone is a weak split signal. If you split one out, document why.
- **Drop-caps.** The oversized first letter (often a different font like ParkAvenue) should be merged into the first word of the first paragraph, not emitted as its own block. The "W" in "W ar" becomes "W" + "ar" = "War" (no space). The surrounding small-caps tail, if any, is flattened to regular case.

## Text normalization

- **Ligatures** — U+FB01 `ﬁ` → `fi`, U+FB02 `ﬂ` → `fl`, U+FB03 `ﬃ` → `ffi`, U+FB04 `ﬄ` → `ffl`, U+FB05 `ﬅ` → `st`, U+FB00 `ﬀ` → `ff`. Normalize to ASCII digraphs.
- **Soft hyphens** (`U+00AD`) — strip.
- **Curly quotes** — PRESERVE. Do not flatten curly `"` / `"` / `'` / `'` to ASCII. These appear in the source text and are part of the authored content.
- **Em-dash** `—` — preserve.
- **En-dash** `–` — preserve.
- **Cross-line hyphenation** — when a line ends with `-` AND the next line begins with a lowercase letter AND the split appears to be mid-word (not an em-dash context, not a list-item prefix), strip the `-` and join the lines without inserting a space. **Exception — preserve compound-word hyphens.** Keep the hyphen when the joined result is a legitimate compound. Maintain a narrow allowlist of compound prefixes: `self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`, and the small-number prefixes `one-`, `two-`, `three-`, `four-`, `five-`, `six-`, `seven-`, `eight-`, `nine-`, `ten-` (for fractions like `one-half` and compounds like `four-fold`). When the string preceding the line-end `-` matches one of these, keep the hyphen AND join the lines without inserting a space (no `self- pity` or `one- half`). **Do NOT include `re-`, `pre-`, `sub-`, `super-`, `ex-`** — these produce false positives on common body-prose words (`remember`, `return`, `prepare`, `submit`, `supply`, `experiences`, `explanation`) that overwhelmingly outnumber genuine compounds.

## Heuristics known useful

These are from the Wave 1 ch05 pilot. Agents are free to adapt per section.

- **Body font is size 12.0 in this PDF** (NewCaledonia). Headings are typically 13.5. Running headers/footers are 9.0. Resentment-table body is 11.0. Chapter label ("Chapter N") is 12.5 italic.
- **Body left margin alternates by page parity** — odd pages ≈ col 69, even pages ≈ col 52. Paragraph-start indent is +12 pts past the body margin.
- **Running headers are always at `y0 < 50`**, bottom footers at `y0 > 500` (letter-size page).
- Drop caps are in **ParkAvenue font at ~51pt** and sit at the top-left of the first body paragraph.

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
