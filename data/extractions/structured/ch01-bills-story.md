# ch01-bills-story — extraction report

## 1. Summary

Extracted `ch01-bills-story` (pages 22–37) into 72 blocks: 1 heading, 69 paragraphs, 1 verse, 1 footnote. All four re-pilot success targets pass on output:

- First paragraph starts with `War fever` (drop-cap merged, no gap).
- Hampshire Grenadier tombstone is exactly one `verse` block with 6 `\n`-separated lines.
- All dialogue (including `“Come, what’s all this about?’’`, `“I’ve got religion.’’`, `“Why don’t you choose your own conception of God?’’`, and the doctor’s line) stays inside `paragraph` blocks.
- The `*In 2006, A.A. is composed of over 106,000 groups.` footnote is emitted as `footnote` kind.
- No `heading` block for the `Chapter 1` italic label; the only heading is `BILL’S STORY`.

No schema deviations. Curly quotes preserved. Ligatures expanded (`ﬁ`, `ﬂ` → `fi`, `fl`). Cross-line hyphenation joined (`Platts- / burg` → `Plattsburg`, `self- / pity` → `selfpity` — see flagged note below).

## 2. Method

- Library: **PyMuPDF** only (`pymupdf.open(...)`, `page.get_text("dict")`). No pdfplumber needed.
- Iterated `pdfPageStart..pdfPageEnd` (pages 22–37, PyMuPDF idx 21–36).
- Per line: kept `(text, x0, y0, x1, y1, font, size)` tuple, normalized text (ligature → ASCII, soft hyphens stripped, curly quotes preserved).
- Dropped layout artifacts:
  - Any line with `y0 < 50` (running headers: `BILL’S STORY`, `ALCOHOLICS ANONYMOUS`, running page numbers).
  - Page-number-only lines at `y0 > 500` (footer "1" on the chapter-opener page).
  - The `Chapter 1` italic NewCaledonia-Italic 12.5pt line on page 22 per conventions.
- Block assembly walk in (page, y, x) reading order:
  - The `NewCaledonia` 13.5pt `BILL’S STORY` line → `heading`.
  - The `ParkAvenue` 51.6pt `W` (drop-cap) → consumed and prepended (no space) to the start of the first paragraph.
  - Hampshire Grenadier verse detected as contiguous lines on page 22 with `x0 >= 95.0` (well above body margin 54) and `y0 ∈ [330, 415]`, NewCaledonia body font. Emitted as one `verse` block, `\n`-joined, per-line `.rstrip()`.
  - Footnote on page 37: line starting with `*` with `size < 10` at `y0 > 500`, Times-Roman 8pt → `footnote`.
  - Italic 9pt signature at the end of page 37 (`Bill W., co-founder of A.A., / died January 24, 1971.`) → emitted as a regular `paragraph` block (see decision below).
  - All other body lines assembled into paragraphs, with a paragraph-start rule of `x0 >= body_margin + 8` and a body-margin-per-page computed as the minimum x over NewCaledonia body-font lines on that page (≈ 54 on even pages, ≈ 71 on odd pages).
- Cross-line hyphenation: when a joined line ends with `-` and the next starts with a lowercase letter, strip `-` and concatenate without a space. Otherwise lines join with a single space.
- Paragraph-start detection guarded against drop-cap wrap: on page 22, while `y < 185` (within the W-glyph footprint), extra-indented lines are treated as the continuation of the first paragraph, not as new paragraphs.

## 3. Schema decisions

### a. Drop-cap ("W" → "War")

The oversized ParkAvenue `W` (x=53.5, y=125, 51.6pt) is merged into the first body line (`ar fever ran high…`) with **no space**: `"W" + "ar fever…" = "War fever…"`. The drop-cap line is not emitted as its own block. Per conventions §"Drop-caps".

There was a subtle wrap issue: the two lines immediately following the drop-cap (y in ~140–155, x=94.2) are indented around the W-glyph footprint, so they look like paragraph starts under the naïve `x >= body_margin + 8` rule. Guarded via a `y < 185` drop-cap-wrap zone on page 22. Without this guard the first paragraph splits into three fragments; with it, the first paragraph is one coherent block ending at `…turned to alcohol.`

### b. Hampshire Grenadier verse

PyMuPDF exposes the verse as three separate text-blocks (L4, L5, L6 in the page dict) because the PDF chunks them by proximity. I rejoined them by coordinate/content rules: page 22, body font, `x >= 95`, `y ∈ [330, 415]`. The result is a single `verse` block with 6 physical lines preserved as `\n`-separated rows:

```
“Here lies a Hampshire Grenadier
Who caught his death
Drinking cold small beer.
A good soldier is ne’er forgot
Whether he dieth by musket
Or by pot.”
```

Opening `“` (U+201C) and closing `”` (U+201D) from the source are preserved; line 5 ends without trailing punctuation in the source so none was added.

### c. Dialogue in prose → `paragraph`

The old-school-friend conversation on pages 29–33 contains multiple short paragraphs whose text is entirely or mostly dialogue. Per conventions, "lines starting with an opening quote" is NOT sufficient signal for `verse`. All such blocks remain `paragraph`:

- `p034`: `“Come, what’s all this about?’’ I queried.`
- `p035`: `He looked straight at me. Simply, but smilingly, he said, “I’ve got religion.’’`
- `p050`: `My friend suggested what then seemed a novel idea. He said, “Why don’t you choose your own conception of God?’’`
- `p063`: `Finally he shook his head saying, “Something has happened to you I don’t understand. But you had better hang on to it. Anything is better than the way you were.” …`

### d. Footnote

Emitted as `footnote` with the leading `*` marker preserved in the text: `*In 2006, A.A. is composed of over 106,000 groups.` Rationale for keeping `*`: content fidelity; the marker lets consumers visually or logically link the footnote to the `.*` in `p068` (`…growing in numbers and power.*`). Conventions do not mandate stripping the marker. Open question — see Schema proposals §5 for marker-handling options.

### e. Italic signature line ("Bill W., co-founder of A.A., died January 24, 1971.")

These two italic lines (NewCaledonia-Italic, 9pt, centered `x≈155`) appear after the final prose paragraph on page 37, with visual whitespace between them and the body. They are editorial attribution, not prose by Bill. I emitted them as **one `paragraph` block** (lines joined with a space into a single sentence). Defensible alternatives:

- Emit as a separate kind (e.g. `byline` or `attribution`) — would need a new `BlockKind`.
- Emit as `blockquote` — semantically wrong; it's not a quotation.
- Drop entirely — loses information.

I chose `paragraph` because it keeps us on the current schema and consumers can style the block separately if needed (by matching text or position). See Schema proposals §5.

### f. No "Chapter 1" heading

Per conventions: dropped. The `Chapter 1` italic line at y=76 on page 22 is filtered before block assembly.

### g. Small-caps handling

Two lines in the PDF use `NewCaledonia-SC` (small-caps) font for stylistic emphasis on dates/time-markers:

- p22 L2.0 `ar fever ran high in the New England town` — the line immediately after the drop-cap. PyMuPDF extracts it as lowercase-looking letters already, which reads correctly (`War fever ran high…`) and matches the visible typography (`WAR FEVER RAN HIGH`… rendered as small caps). No transform applied.
- p29 L2.3 `1934, I was off again.` — small-caps start for `ARMISTICE DAY 1934`; surrounding text is normal. PyMuPDF delivers the small-caps portion as lowercase characters, which the paragraph-join silently merges. Output reads natural: `…on Armistice Day 1934, I was off again.` — no loss, no duplication.

Both cases pass through cleanly without a dedicated small-caps pass. I documented this in code with a `flatten_smallcaps` placeholder.

## 4. Flagged blocks

### p067 — `selfpity` (cross-line hyphen join)

```
…and was plagued by waves of selfpity and resentment.
```

The source text on page 36 has `self-/pity` broken across line boundaries. The conventions rule ("line ends with `-` AND next line begins with lowercase → strip and join without space") strictly applied produces `selfpity`, but the semantically intended token is `self-pity` (a hyphenated compound, not an in-word line-break). This is an ambiguous case: the visual break is identical to a normal hyphenation break, and there is no font/coordinate signal to distinguish them.

The same issue does NOT occur at `self- / sacrifice` (p066) because there the break appears to fall inside a real mid-word hyphenation (`sacrifice`, not a compound). It also does not happen at `well-to-do` (all on one line) or `new-found` (all on one line). I did not special-case `selfpity` because no heuristic distinguishes it reliably without a lexicon.

This same pattern will occur elsewhere in the book. Flagging for Plantin — see Schema proposals §5.

### p068 — footnote marker `*` preserved mid-text

`p068` ends `…growing in numbers and power.*` with the `*` present because it's part of the source line. Downstream consumers need to know the `*` ties to `f072` (the footnote block). No association metadata is currently carried in the schema. Non-blocking here but a cross-chapter concern.

### p071 — signature line

```
Bill W., co-founder of A.A., died January 24, 1971.
```

Emitted as `paragraph`. See §3e for the decision rationale; proposal in §5 if we want a dedicated attribution kind.

### Small-caps `ARMISTICE DAY 1934` case in p030

The small-caps tail passes through as lowercase (`…on Armistice Day 1934, I was off again.`) — the transition is invisible in output text. Flagging only because it's a latent case where a PDF with glyph-level small-caps that happen to show up as uppercase letters (other chapters, possibly) would need a different code path. Nothing to fix here.

## 5. Schema proposals

These are not blocking for ch01-bills-story's artifact; flagging for Plantin's review between waves.

### Proposal 1 — Footnote marker association

Currently a footnote block is a standalone `footnote` with leading `*` (or `†` etc.). The in-paragraph reference (`…numbers and power.*`) is disconnected. Consider adding an optional `marker?: string` field on both the footnote block and the referencing paragraph, or a `references?: string[]` on blocks pointing to footnote block ids. For ch01 there's only one footnote, so no pressing need; but the rest of the book may have more.

If accepted: minor addition, backward-compatible. The leading `*` in the footnote `text` could then be either stripped or retained as a visual marker.

### Proposal 2 — `attribution` or `byline` BlockKind (or `kind` sub-type)

Bill W.'s signature at the end is structurally an attribution, not authored prose. Other stories in Parts II/III almost certainly have the same pattern (story authors sign off or the editor attributes the story). Options:

- **Add a new `BlockKind`** like `'byline'` / `'attribution'`. Low churn, semantically clean.
- **Keep as `paragraph`** with a convention that "last paragraph of a section in italics, centered" means byline. Fragile; requires consumer heuristics.
- **Add an optional `role?: 'body' | 'byline'` field on `Block`.** More flexible than a kind, doesn't explode the enum.

Recommend: add `'byline'` to `BlockKind` as a small, targeted addition. Propagate to later waves so they don't have to re-argue the case.

### Proposal 3 — Compound-word vs line-break hyphen disambiguation

The conventions rule strips `-` at end-of-line before lowercase. This is correct for ~95% of cases but produces `selfpity`, `selfsacrifice` (potentially), etc. Two options:

- **Status quo** — accept `selfpity` and document in the .md. Consumers re-insert hyphens if needed.
- **Small compound-word allowlist** — before stripping, check if the joined token (with or without hyphen) starts a set of known compounds (`self-`, `well-`, `new-`, `non-`, `re-`, `co-`, `ex-`). If yes, retain the hyphen. This needs a shared list across sections.

Flagging for Plantin; no action needed for ch01 alone. I left the naïve rule in place and documented the one false positive (`selfpity`) above. If Plantin accepts option 2, every section needs the same allowlist.

### Proposal 4 — Section-title text casing

`BILL’S STORY` is emitted as the heading's `text` value verbatim in ALL CAPS as rendered in the source. The section metadata `title` is `Bill's Story` (title case, ASCII apostrophe). Intentional divergence — heading = visual text, title = canonical. Flagging so later waves don't "fix" the casing.

## 6. Hard-constraint compliance

- No source-code changes. Only touched `data/extractions/structured/ch01-bills-story.json`, `data/extractions/structured/ch01-bills-story.md`, and scripts under `.tmp/`.
- JSON validated: `json.load` succeeds.
- One section only.
