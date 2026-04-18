# copyright-info — extraction report

## Summary

Single-page front-matter section (PDF page 1). Emitted **14 blocks**, all `paragraph`. No heading (none visible on the page — the prompt's `title: "Copyright Info"` is a synthetic metadata-only label). Zero `heading`, `list-item`, `verse`, `byline`, `blockquote`, `footnote`, `table`. JSON validated with `json.load()`.

This was the schema-flexibility test the prompt flagged. Verdict: the existing schema handles copyright-page content cleanly **without** new `BlockKind` values. The page is a **sequence of short independent fragments** (copyright notice, "All rights reserved.", edition list, printing list, Grapevine reprint sentence, Conference-approved italic statement, trademarks sentence, LoC/ISBN/printed-in lines) — each is best represented as its own `paragraph`. See **Schema proposals** below for a narrow optional enrichment (role/label tagging) that is NOT needed but is worth recording for future semantic consumers.

## Method

- **Library:** PyMuPDF only (`page.get_text("dict")`). No `pdfplumber` needed.
- **Scripts:**
  - Probe: `.tmp/probe-copyright-info.py`
  - Extractor: `.tmp/extract-copyright-info.py`
- **Pipeline:**
  1. Open page 1 via PyMuPDF and collect non-blank lines in document order.
  2. Normalize text (ligatures, soft hyphens, NUL) — none of these fired; page is ASCII + `©`/`®` symbols + curly nothing (all quotes are ASCII on this page).
  3. Group consecutive lines into logical paragraphs using a **three-signal paragraph-break rule**:
     - Previous line ends with `.!?` → break.
     - Current line's first word is a "parallel-entry cue" (`First`, `Second`, `Third`, `Fourth`, `Eighteenth`, `ISBN`, `Library`, `Printed`, …) → break.
     - Vertical gap between line baselines > 18pt → break.
     - Otherwise → continuation; append line to current paragraph.
  4. Emit each paragraph as a `paragraph` block. No heading synthesized.

### Heuristics fired

- **Y-gap paragraph-break.** Within-paragraph line spacing is ~12pt; between-paragraph whitespace gaps range from 25pt (single-blank-spacer) to 100+pt (multi-blank-spacer). The 18pt threshold cleanly separated the copyright-block, the ©-reprint sentence, the italic conference-approved line, the trademarks sentence, and the three bibliographic bottom lines.
- **Parallel-entry cue.** The edition list (First/Second/Third/Fourth Edition) and the printing list (First/Eighteenth printing) all fall **inside** a single PyMuPDF block each with ~12pt line spacing — so y-gap alone won't split them. A simple rule "next line starts with an ordinal word → new paragraph" cleanly splits them without hard-coding.
- **Sentence-terminator paragraph-break.** Closed the Grapevine 3-line sentence correctly at `"...with permission."` before starting the next paragraph.

### Heuristics NOT needed

- **Heading detection** — there is no heading on this page.
- **Drop-cap merge** — no drop-cap.
- **Cross-page paragraph merge** — single page.
- **Cross-line hyphenation** — no line ends in `-`.
- **Running-header drop** — the first line (`Copyright © 1939, ...`) sits at `y0=45.4`, which is inside the conventions' `y0 < 50` running-header drop zone. But the conventions' rule requires `AND size <= 9.5`; this line is size 10.02, so the rule correctly did NOT fire. This is a textbook case of why the `size <= 9.5` conjunction matters.

## Schema decisions

1. **No heading block emitted.** The prompt explicitly permitted this: "Emit any visible heading element at the top of the page (if any), OR emit the section content without a heading block if nothing qualifies." Nothing qualifies — the page opens with the body-weight copyright notice, not a heading. The metadata `title: "Copyright Info"` is a synthetic label for catalog/routing purposes and is not represented in the content blocks.

2. **Edition list as 4 `paragraph` blocks, not `list-item`s.** The conventions reserve `list-item` for **explicit lists** with numeric, lettered, or word-ordinal markers ("1.", "(a)", "One-", "I."). The edition lines have no such markers — each is a standalone phrase. The prompt agreed: "Short block-like text fragments are expected (edition lists, trademarks). Use `paragraph` kind for those; only emit as `list-item` if they are formatted as an explicit list." I emitted each edition and printing line as its own `paragraph` because they are **visually and semantically independent** — Fourth Edition sits in a separate PyMuPDF block from the First/Second/Third trio, with a ~25pt gap between them, further supporting per-line emission.

3. **"Copyright © ..." sentence joined across 2 lines into 1 paragraph.** The sentence `"Copyright © 1939, 1955, 1976, 2001 by Alcoholics Anonymous World Services, Inc."` breaks at a 2-line wrap in the source. Joined into a single paragraph via the y-gap + no-terminator rule.

4. **Grapevine notice joined across 3 lines and 3 PyMuPDF blocks into 1 paragraph.** `"Personal stories on pages 407, 476, 494, 531, and 553 are copyrighted © by The A.A. Grapevine, Inc., and are reprinted here with permission."` — the first two lines don't end in terminators, so they chain into the third line. PyMuPDF had split this across blocks 5, 6, and 7, but the content-aware rule put it back together.

5. **Italic "Conference-approved" line emitted as plain `paragraph`.** The text is italic (`NewCaledonia-ItalicOsF`) but italics alone are NOT a schema split signal (per conventions' Emit-with-care rule: "italicized pull-quotes within prose ... Kept inline with the surrounding paragraph is the current precedent"). Here the italics are purely typographic — it's a standalone statement sitting in its own visual block. Emitted as a single `paragraph` block covering both lines (`"This is A.A. General Service Conference-approved literature"`).

6. **Trademark glyphs preserved inline.** The `©` and `®` characters come from an `ArialMT` fallback font span; `normalize_text` does not touch them. They appear in the text as Unicode `©` (U+00A9) and `®` (U+00AE), both preserved. No special-case code needed — PyMuPDF's span concatenation already placed them in-line.

7. **Bibliographic lines (LoC / ISBN / Printed in US) as 3 separate paragraphs.** The LoC line ends with a number (no sentence-terminator), ISBN starts with `ISBN` (parallel cue), and there is a y-gap before `Printed in the United States of America`. Each becomes its own block. Alternative considered: merge them into a single "bibliographic metadata" paragraph. Rejected — they are visually separate, semantically distinct (catalog ID, ISBN, locale), and the conventions don't support an aggregating kind. Per-line emission preserves structure for downstream consumers that want to pick out the ISBN or LoC independently.

## Flagged blocks

None are uncertain. All 14 paragraph blocks cleanly match the visible lines on page 1.

Spot-checks:

- `copyright-info-p001` — `"Copyright © 1939, 1955, 1976, 2001 by Alcoholics Anonymous World Services, Inc."` — joined from 2 source lines, `©` preserved.
- `copyright-info-p009` — `"Personal stories on pages 407, 476, 494, 531, and 553 are copyrighted © by The A.A. Grapevine, Inc., and are reprinted here with permission."` — 3-line multi-block merge.
- `copyright-info-p010` — `"This is A.A. General Service Conference-approved literature"` — italic deck, joined as one paragraph.
- `copyright-info-p011` — `"Alcoholics Anonymous and A.A. are registered trademarks® of A.A. World Services, Inc."` — `®` preserved.
- `copyright-info-p013` — `"ISBN 1-893007-16-2"` — literal ISBN with hyphens (no cross-line joining).

## Schema proposals

### No new `BlockKind` needed

The copyright-page content fits inside `paragraph`. I considered these alternatives and rejected them:

| Alternative                                                            | Why rejected                                                                                                                                                               |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New kind `colophon` or `imprint` for the whole page                    | Over-specific. The containing `BookSection` already carries `id: "copyright-info"` and `kind: "front-matter"`; a block-level `colophon` kind would duplicate that signal.  |
| `list-item` for edition and printing lines                             | Not an explicit list — no markers.                                                                                                                                         |
| `byline` for "Alcoholics Anonymous World Services, Inc."               | `byline` is for author/story attributions. Publisher imprint is different semantics.                                                                                       |
| `blockquote` for the italic Conference-approved line                   | `blockquote` is reserved for editorial interludes (conventions: "Reserve this kind for editorial interludes or inset passages"). The italic statement is not an interlude. |

### Optional enrichment (deferred, NOT proposed for this wave)

A block-level **semantic role** annotation — e.g. `role?: "copyright" | "edition" | "printing" | "reprint-notice" | "trademark" | "isbn" | "loc" | "imprint"` — would let downstream consumers pick the ISBN, copyright year, or trademarks without string-matching the paragraph text. This is useful for a future "book metadata" extractor that consumes the structured artifact.

**Why I am NOT proposing it now:**

1. The rest of the book has almost no copyright-page-like content. Adding a `role` field for 14 blocks out of thousands is low-leverage.
2. The Wave 5 retrospective in the conventions doc already shows a strong preference to add new `BlockKind` values only when unavoidable. `role` on the existing `paragraph` kind would be the less-disruptive path if the enrichment is ever pursued.
3. The immediate consumer (consolidated `en-4th-edition.json` + `BookSection` conformance) does not need it.

Flagging this for Plantin's awareness — not a proposed conventions change.

### Heading handling for heading-less sections (accepted documentation, not a change)

This section demonstrates the "no heading block" path that the conventions doc already implicitly permits via the agent prompt: "Emit any visible heading element at the top of the page (if any), OR emit the section content without a heading block if nothing qualifies." Confirming: the consolidated artifact consumer must tolerate `BookSection.blocks` that lack a leading `heading` block. If any downstream consumer assumes `blocks[0].kind === 'heading'`, it will break on this section (and possibly others, if later sections follow this pattern).

## Hard-constraint check

- JSON parses. Verified with `json.load()`.
- Wrote only to `data/extractions/structured/copyright-info.json`, `data/extractions/structured/copyright-info.md`, and `.tmp/*`.
- No source-code changes, no commits, no pushes, no npm.

## Kind counts

| Kind         | Count |
| ------------ | ----- |
| `heading`    | 0     |
| `paragraph`  | 14    |
| `list-item`  | 0     |
| `verse`      | 0     |
| `blockquote` | 0     |
| `footnote`   | 0     |
| `byline`     | 0     |
| `table`      | 0     |
| **Total**    | **14** |
