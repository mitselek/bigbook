# appendix-aa-pamphlets — extraction report

## Summary

Final page of the book (p. 581). A single-page catalog of A.A. pamphlet titles. Extracted **54 blocks**: 1 heading, 49 `list-item` blocks (pamphlet titles), and 4 `paragraph` blocks (3 inline parenthetical annotations + 1 trailing italic order-info footer). No byline, no verse, no footnote, no table.

Kind counts:

- `heading`: 1
- `list-item`: 49
- `paragraph`: 4

## Method

Called `pymupdf.open(...)` then `page.get_text("dict")` on page 581 (0-indexed 580). No `pdfplumber` needed — PyMuPDF's per-line spans already gave font, size, bbox and x0 signals. No cross-page merge (single page). No superscript fractions, no drop-cap, no running headers on this page (verified empirically — the page-top `y0 < 50` guard never fires because the heading is at y=55.35).

Heuristics fired:

- Heading detection: `size >= 14.0` AND font contains `"Helvetica"`. The heading is `A.A. Pamphlets` set in **Helvetica-Bold at 17pt**, visually distinct from the body (Times-Roman 7.5pt).
- List-item detection: default for body Times-Roman lines at x0 ≈ 69.28 that are not parenthetical annotations.
- Paragraph detection: lines that start with `(` and end with `)` (parenthetical annotations describing pamphlets above them); plus the italic footer (NewCaledonia-Italic 7.5pt) grouped into one paragraph.

## Schema decisions

### Heading — no roman-numeral prefix

This appendix has **no roman-numeral prefix** in the source, unlike appendices I–VII. The heading on the page is simply `A.A. Pamphlets`. Emitted heading text = `A.A. Pamphlets` (visual rendering preserved). The section metadata `title` was already `A.A. Pamphlets` — no divergence.

Font is also different from other appendices: **Helvetica-Bold 17pt** (vs the NewCaledonia-SC ~13pt used for appendices I–VII). This confirms visually that this appendix is formatted as a catalog page distinct from the conventional appendix style.

### Parenthetical annotations — `paragraph`, not `list-item`

Three lines are parenthetical annotations about pamphlets above them, not pamphlet titles:

- `(Two above are full-color, comic-book-style pamphlets)` (after "What Happened to Joe" and "It Happened to Alice")
- `(Above is a cartoon pamphlet for teenagers)` (after "Too Young?")
- `(Above is an illustrated pamphlet for inmates)` (after "It Sure Beats Sitting in a Cell")

They share the Times-Roman 7.5pt font and x0 ≈ 69.28 with the pamphlet titles, so typographically they look identical — but semantically they are editorial meta-annotations, not pamphlet entries. Emitted as `paragraph` blocks so a downstream consumer iterating over `blocks[*].kind === 'list-item'` sees exactly 49 pamphlet titles, not 52 entries three of which are parenthetical noise.

### Footer italic order-info — single `paragraph`

Two italic lines form one sentence:

```
Complete order forms available from A.A. General Service Office:
Box 459, Grand Central Station, New York, NY 10163
```

They render in NewCaledonia-Italic 7.5pt, typographically distinct from the Times-Roman catalog above. Emitted as a single `paragraph` block (the two lines joined with a space). No byline signature here — this is an editorial pointer to the GSO, not an author attribution.

### 49 pamphlet titles → `list-item`

Straightforward. Each line is a separate pamphlet title, one per `list-item` block. No hanging-indent continuations (the longest line, "Alcoholics Anonymous as a Resource for the Health Care Professional", fits on a single visual line at x1 ≈ 286, well within the page column). Ordering preserved by y0.

## Flagged blocks

None — all 54 blocks are high-confidence.

Minor notes worth surfacing:

- `appendix-aa-pamphlets-l036` is `A Message to Correctional Facilities Adminstrators` — note the source spelling `Adminstrators` (missing an `i`). This is a typo **in the source PDF**, not in the extraction. Verified by re-reading the raw PyMuPDF line text (`'A Message to Correctional Facilities Adminstrators'`). Preserved verbatim per convention of fidelity to authored content.
- Curly quotes (e.g. `A Newcomer Asks . . .`, `Do You Think You’re Different?`, `Let’s Be Friendly With our Friends`, `A Member’s-Eye View of Alcoholics Anonymous`) preserved per conventions.
- Em-dashes in three pamphlet titles (`A.A. Tradition—How It Developed`, `Can A.A. Help Me Too?—Black/African Americans Share Their Stories`, `A.A. for the Older Alcoholic—Never Too Late`, `The A.A. Member—Medications and Other Drugs`) preserved per conventions. None of these are cross-line joins; all are within-line em-dashes.

## Schema proposals

None. The existing `BlockKind` enum handles this page cleanly (`heading` + `list-item` + `paragraph`). The parenthetical-annotation case did not require a new kind — `paragraph` is an adequate fit for "editorial meta-text that is not a list entry".

One minor observation that is **not** a proposal: this page is the first and (as far as I'm aware) only section where `list-item` is the dominant kind AND the list is not a numbered/lettered series (unlike the Twelve Steps, Twelve Traditions, Twelve Concepts). The convention-level rule ("numbered or lettered lists as `list-item`") was silent on unnumbered catalog lists. I interpreted "list-item" as the correct kind because the visual typography is a flat list (one entry per line, shared left margin, no first-line indent). If a stricter reading is preferred (`list-item` only for enumerated lists), then these 49 blocks would need to become `paragraph` blocks, which would lose the list-vs-prose signal. I recommend keeping them as `list-item`; flagging here for PO awareness.
