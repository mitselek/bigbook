# story-elu-opilane — extraction report

## Summary

Structured extraction for the Estonian Part-III story **Elu õpilane** (PDF pages 351–359, book pages 319–327). EN counterpart: *Student of Life*. The section is a clean, single-narrator first-person recovery story with no footnotes, no lists, no verses, no byline, and no editorial interludes. Emitted **30 blocks**: 1 `heading`, 1 `paragraph` (italic deck), 28 body `paragraph` blocks. Drop-cap (`H`), italic deck, and running-header/page-number/story-number drops all handled in the standard ET pattern.

## Method

PyMuPDF `page.get_text("dict")` across pages 351..359. Per-line sort key `(pdf_page, y0, x0)`. No `pdfplumber` use.

Heuristics fired:

- **Running header + page number drop** — `y0 < 45 AND (size <= 11.5 OR digits)`. Confirmed at `y=34.99` on pages 352–359.
- **Bottom-of-page page number drop** — `y0 > 520 AND size <= 11.5 AND digits`. Page 351 `"319"` at `y=530.79`.
- **Story-number drop** `(6)` on page 351 at `y=66.87` size 13 — matched with the `STORY_NUMBER_RE` + `y0 < 75` guard.
- **Heading detection** — `size ∈ [13.5, 15.0]` + text contains `ELU`/`ÕPILANE` + page 351.
- **Italic deck** — NewCaledoniaLTStd-It at `y ∈ [105, 170]` on page 351. Four wrapped lines joined into a single `paragraph` block.
- **Drop-cap merge** — BrushScriptStd 33pt `H` at `(x≈55.69, y≈174.26)`. First body line at `(x≈90.58, y≈178.72)` merged no-space → `"Hakkasin jooma..."`.
- **Drop-cap wrap-zone** — `H` is wide, wrap band `y ∈ [174, 200]` and `x ∈ [82, 100]`. Second body line at `y=193.22, x=90.58` absorbed into the first paragraph.
- **Paragraph-start detection** — `x ∈ [64, 80]` (first-line indent at 68.03 vs body margin 56.69).
- **Cross-page paragraph merge (terminal-punctuation heuristic)** — decision per boundary:
  - 351→352: previous ends with `.` + page 352 line 1 at `x=68.03` indent → **split** (new paragraph).
  - 352→353: previous does NOT end with terminal punctuation + page 353 line 1 at `x=56.69` continuation → **merge**.
  - 353→354: previous no terminal, continuation → **merge**.
  - 354→355: previous no terminal, continuation → **merge**.
  - 355→356: previous no terminal, continuation → **merge**.
  - 356→357: previous no terminal, continuation → **merge**.
  - 357→358: previous ends `.` + page 358 line 1 at `x=68.03` indent → **split**.
  - 358→359: previous no terminal (`"Lubadused"`) + continuation → **merge**.

## Schema decisions

- **Italic deck emitted as a single `paragraph` block** per ET conventions default. Deck is 4 wrapped lines of prose, no multiple first-line-indent groups — one logical paragraph.
- **Drop-cap `H` + `akkasin` joined no-space** per ET conventions (drop-cap single-letter initial of first word).
- **Story-number `(6)` dropped entirely** — not emitted as heading or paragraph. Standard ET practice.
- **Intra-paragraph italic emphasis kept inline** — NewCaledoniaLTStd-It lines inside body paragraphs (page 354 `"W"` continuing the title `"Mu nimi on Bill W"`; page 356 `"ma teadsin, et teen selle pudeli jälle lahti"`; page 357 `"nüüd!"`) were NOT split out as separate blocks. Italics alone is a weak split signal (parent-conventions precedent).
- **Line-end `-` preserved** per ET Wave 4 refinement (authored compound). Applies intra-line to tokens like `viski-` (page 354 `"koos viski- ja toonikupudeliga"`) and to the intra-paragraph `"viski­koguseid"` soft-hyphen join (page 354→355 boundary) which becomes `"viskikoguseid"`.
- **Soft hyphens (U+00AD)** stripped at join time across all ~60+ cross-line splits in the section. None of these required compound-word preservation in ET (the soft-hyphen mechanism handles them).

## Flagged blocks

None uncertain. All block boundaries verified against the probe output.

Minor note on **block p014** (page 354): source has a double space after `"Mina ka ei teadnud."` before `"Teadsin"` (visible in probe at `y=266.41`). The line-join regex `[ \t]{2,} → " "` collapses this to single space. Prior ET extractions (e.g. `extract-mees-hirmu.py`) use the same collapse; following that precedent rather than preserving the double space as a source quirk, since internal whitespace normalization is standard across ET paragraph joins.

## Schema proposals

None. This section exercised only established conventions.

## Block counts

- `heading`: 1
- `paragraph`: 29 (1 italic deck + 28 body)
- Total: 30

## Front-matter verdicts

| Field | Value | Verdict |
|---|---|---|
| `id` | `story-elu-opilane` | matches metadata |
| `kind` | `story` | matches metadata |
| `title` | `Elu õpilane` | prose-case metadata (heading block renders `ELU ÕPILANE`) |
| `parentGroup` | `personal-stories/they-stopped-in-time` | matches metadata |
| `pdfPageStart` | 351 | matches metadata |
| `pdfPageEnd` | 359 | matches metadata |
| `bookPageStart` | 319 | matches metadata, verified visible on p351 footer (`"319"`) |
| `bookPageEnd` | 327 | matches metadata, verified visible on p359 header (`"327"`) |
