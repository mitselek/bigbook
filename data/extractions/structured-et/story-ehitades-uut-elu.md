# story-ehitades-uut-elu — extraction notes

## Summary

Estonian translation of `story-building-a-new-life` (Part III #6 — "They Lost Nearly Everything"). PDF pages 508–517 (book pages 476–485). Emitted **38 blocks** = 1 heading + 1 italic deck paragraph + 36 body paragraphs. **Exact block-count parity with the EN counterpart** (`story-building-a-new-life`: 38 blocks; same 1 + 1 + 36 split). No list-items, blockquotes, verses, footnotes, bylines, or tables — layout is pure narrative prose with a single drop-cap opener.

## Method

- PyMuPDF `get_text("dict")` per-line spans, sorted by `(page, y0, x0)` for reading order.
- ET running-header drop: `y0 < 45 AND (size <= 11.5 OR text.isdigit())`. Catches the 11pt `ANONÜÜMSED ALKOHOOLIKUD` / `EHITADES UUT ELU` running headers at `y≈34.99` and both page-number variants.
- Extra drop on page 508: line matching `^\(\d+\)\s*$` at `y < 85` — strips the `(6)` story-number prefix at `y≈73.33`.
- Extra drop: bottom-of-page numeric-only footer (page 508 has a stray `'476'` at `y≈530.79`, size 11). Dropped when `isdigit() and size <= 11.5 and y0 > 520`.
- Heading: page 508, size 13.5–15.0, text matches `EHITADES UUT ELU` (rendered at 14pt, centered at `x≈124.55`, `y≈88.33`).
- Drop-cap: page 508, font contains `BrushScript`, size ≥ 20 → glyph `M` at `x≈54.69`, `y≈175.63`, size 33pt. Merged with first body line (`e olime terve päeva...` at `x≈95.25`, `y≈180.09`) → `Me olime terve päeva...` (no space).
- Drop-cap wrap-zone on page 508: `y0 in [180..200]` AND `x0 in [90..100]` — body lines here are continuations of the opening paragraph, not new paragraph starts. Wide-glyph `M` → `+35` wrap offset from body margin (56.69 + 35 ≈ 92, matches observed `x≈95.25`).
- Italic deck on page 508: font contains `-It`, `y0 in [100..170]`. Four wrapped lines (`y = 113.45, 127.95, 142.45, 156.95`) emitted as a **single paragraph** block.
- Body paragraph-start: first-line indent `64 <= x0 < 80` (indent at `x≈68.03`); continuations at `x≈56.69`.
- Line-join rules (ET):
  - Trailing `U+00AD` (soft hyphen) → strip and join no-space (the ET cross-line mechanism; fires throughout the body).
  - Trailing U+002D hyphen → preserve and join no-space (ET Wave 4 — authored compound; did not fire in this section).
  - En-dash `–` / minus `−` at line-end: space-padded → join with space; tight → join no-space.
  - Default: join with single space.
- Cross-page paragraph merges: implicit via reading-order walk — each cross-page continuation starts at the body-margin (`x≈56.69`), so paragraph-indent signal correctly keeps it attached to the prior block. No explicit terminal-punctuation post-pass needed.

## Schema decisions

- **Story-number prefix `(6)`**: **dropped** per ET conventions (structural numbering, not authored content).
- **Italic deck**: emitted as **one `paragraph`** block. Four visual lines, first at `x=68.03` (deck indent) and subsequent at `x=56.69` — a single flowing sentence that wraps. Matches EN exemplar's single deck paragraph.
- **Drop-cap `M`**: merged with first body line fragment (`e olime...` → `Me olime...`). No space. Wide-glyph `+35` wrap-zone applied.
- **No byline**: final paragraph ends `Ma tean, ma proovisin.` — no author sign-off, matching EN structure (EN ends `I know, I tried it.` without byline).
- **No list items**: the body contains no enumerated content.
- **`parentGroup`**: preserved as `personal-stories/they-lost-nearly-all` verbatim from metadata.

## Source quirks preserved (not bugs)

- **`tähistastamiseks`** (p025) — duplicate syllable; should be `tähistamiseks`. Source typo preserved.
- **`Järgise`** (p013) — should be `Järgmise`. Source typo preserved.
- **`peagi tõeline pidu lahti.`** / similar slightly awkward phrasings kept verbatim.
- **`kolmeteist`** (p006) — should be `kolmeteistkümnest` or similar. Source abbreviation kept.
- **`G.I. Bill'i`** (p013) — ASCII apostrophe inside curly-quoted surrounding text. Source-faithful.
- Pattern: same class as Wave 1's `o1i`/`sõruskonna`/`Bill W,` — fidelity to source beats grammatical correctness.

## Flagged blocks

- `p002` (italic deck): 4 visual lines, mixed indents (`x=68.03` start + 3× `x=56.69` continuation). Detected by font-style (`-It`) + y-range rather than indent, so continuation lines at body-margin correctly absorbed into the deck paragraph. Would falsely split as a body paragraph under the `64 <= x0 < 80` rule; hard-coded y-range override handles it.
- `p003` (drop-cap opener): first two lines at `x≈95.25` (drop-cap wrap-zone), then continuation shifts to body-margin `x≈56.69` at `y=209.09`. Wrap-zone heuristic correctly keeps all three lines in the same paragraph (no false paragraph-break at the wrap transition).
- `p013`: contains `G.I. Bill'i` with ASCII apostrophe mid-line. No merge issue — the apostrophe is authored content.
- Cross-page merges: no explicit split decisions were needed. Every cross-page continuation starts at `x≈56.69` (body-margin) and the continuing paragraph stays attached. Each paragraph starts at `x≈68.03` (indent), confirming first-line-indent is the reliable boundary signal for this section's narrative prose.

## Schema proposals

None. Existing ET conventions cover every case in this section cleanly.

## Counts

| kind      | count |
| --------- | ----: |
| heading   |     1 |
| paragraph |    37 |
| **total** |  **38** |

EN counterpart (`story-building-a-new-life`): 38 blocks (1 heading + 1 deck + 36 body). ET matches EN exactly.

## Front-matter metadata verdicts

| field | value | verdict |
| --- | --- | --- |
| `id` | `story-ehitades-uut-elu` | matches metadata |
| `kind` | `story` | matches |
| `title` | `Ehitades uut elu` | matches |
| `parentGroup` | `personal-stories/they-lost-nearly-all` | matches |
| `pdfPageStart` | 508 | confirmed (heading `EHITADES UUT ELU` at p508) |
| `pdfPageEnd` | 517 | confirmed (final paragraph `Vaadates tagasi leian...` at p517) |
| `bookPageStart` | 476 | confirmed (page 508 footer `'476'`) |
| `bookPageEnd` | 485 | confirmed (running headers consistent through 485) |
