# story-it-might-have-benn-worse — extraction report

## Summary

Part II.B story #9 ("They Stopped In Time"), pages 359..369 (11 pages). Emitted **42 blocks**: 1 heading + 41 paragraphs. No list-items, verses, footnotes, tables, blockquotes, or bylines. Standard story structure: story-number drop `(9)`, title, 3-line italic deck, drop-cap `H` merged with first word `How`, straightforward body prose with cross-page paragraph merges, no closing byline.

## Method

- `pymupdf` (`get_text("dict")`), one script: `.tmp/extract-story-benn.py`.
- Heuristics used:
  - Heading detection by font-size ≥13 AND token match (`BEEN`, `WORSE`).
  - Italic deck detection: `Italic` font, size <11.5, y<170 on first page.
  - Drop-cap detection: ParkAvenue font, size >40, first page.
  - Drop-cap + first-body merge: `H` + lstripped first body line → `How...`, SC-tail flattened by PyMuPDF to lowercase (no SC tail in this case — first body span is already NewCaledonia-SC at body case).
  - Body-margin parity: odd pages body-margin 69.28, even 52.28; paragraph indent = body_margin + 8.
  - Cross-line hyphenation with Wave-6 allowlist + multi-hyphen preservation + capitalized-stem preservation + number-prefix qualification.
  - Em-dash line-end join without space.
  - Page-number drop: `y0<50 AND (size<=9.5 OR digits-only)` for top, `digits-only AND y0>500` for bottom. Running-title drop by `y0<50 AND size<=9.5`.
- No cross-page paragraph-merge pass needed: in this story every paragraph either ends with terminal punctuation before a page break OR the first line of the next page lands at body-margin (continuation); the standard per-page indent-split logic handles it correctly. Verified by reading the 11 cross-page boundaries in the probe output.

## Heading text vs title verdict

- `title` metadata (section): **"It Might Have Benn Worse"** — kept from prompt metadata, preserves the outline-form typo "Benn".
- `heading` block text: **"IT MIGHT HAVE BEEN WORSE"** — PDF visual rendering, correct spelling "BEEN".

This intentional divergence is per conventions. Downstream consumers use `section.id` / `section.title` as stable references; the rendered heading is authored content.

## Front-matter verdicts

- **Story-number `(9)`**: DROP. Structural numbering; line dropped at extract-lines stage (regex `^\(\d+\)\s*$` on first page).
- **Heading**: EMIT as `h001`, text `"IT MIGHT HAVE BEEN WORSE"`.
- **Subtitle (3 italic lines)**: EMIT as a single `paragraph` block `p002`. The 3 lines have x-coordinates 93.28 / 81.27 / 81.27 — ONE indent group (first-line indent only), so single-paragraph default applies.
- **Drop-cap `H`**: MERGE with first body line. Result: `"How can a person with a fine family..."` as paragraph `p003`. No SC-pronoun fix needed (no standalone lowercase `i` in opening).
- **Closing byline**: NONE. Story ends with `"...something I was unable to do for myself."` in ordinary body font/margin — no italic sign-off, no right-aligned credit.

## Flagged blocks

### `p010` — `"Hang-overs"` (accepted per convention, known false-positive class)

Source lines on p361:
```
...where I was unlikely to see anyone I knew. Hang-
overs and remorse were always with me.
```
Cross-line hyphen with stem `Hang` (capitalized). Convention's **capitalized-stem hyphen preservation** rule (Wave-6) keeps the hyphen because the stem starts with an uppercase letter. The rule was written for proper-noun compounds (`God-`, `Anglo-`) and conventions explicitly notes the false-positive risk is "low" — but `Hang-overs` (should be `Hangovers`) is exactly such a false-positive, since `Hang` here begins a new sentence rather than naming a proper noun. Emitted as `Hang-overs` to follow conventions; flagging.

### `p012` — `"Re-hearsals"` (same pattern)

Source lines on p361:
```
..."Re-
hearsals" then became a part of the pattern...
```
Quoted-word start `"Re-` with stem `Re` (capitalized). Same capitalized-stem rule preserves the hyphen. Natural form is `Rehearsals`. Note that `re-` is explicitly excluded from the lowercase allowlist (Wave-2 decision to drop false-positive-heavy prefixes) — the capitalized-stem rule here sidesteps that decision because the sentence-start `R` is capitalized. Emitted as `"Re-hearsals"`.

### `p027` — `"hairraising"` (convention-strip, deferred lexical issue)

Source lines on p365:
```
Could I be an alcoholic without some of the hair-
raising experiences I had heard of in meetings?
```
Lowercase stem `hair-` → not in allowlist → hyphen stripped → `hairraising`. Natural compound is `hair-raising`. This is the classic lexical-dictionary-needed case noted as **deferred** in the conventions Evolution Log (Wave-4 deferred). Not in scope to fix here.

### `p015` — em-dash at line-start joined with preceding space

Source lines on p362:
```
...personal plans and ways of doing things
—especially for any interference with my drinking—I
```
The em-dash `—` starts the second line (wrap-continuation); my current em-dash rule only removes the space when the previous line **ends** in `—`. Output contains `"...things —especially..."` (space before em-dash). Cosmetic; not fixing. Flagging as a possible future refinement — either strip the space when joining a continuation that begins with an em-dash, OR leave it alone.

### Minor notes

- `p005` starts with `"I was raised like the majority..."` — this is a second paragraph on p359 after the drop-cap paragraph. Para-indent at x=81.28 (odd-page indent) triggered a new block correctly.
- `p013` / `p014` split on p361: p013 ends at `"...no cooperation."`, p014 starts at `"I was living in constant fear..."` — correct split (next line starts at x=81.28 = odd-page indent).
- `p019` is a single-sentence paragraph on p363 (`"Finally our invitations became fewer..."`). Legitimately short; source is one sentence before the next indented paragraph starts.

## Schema proposals

None. Existing schema + Wave-6 conventions fit cleanly. The `Hang-/Re-` capitalized-stem false-positives are documented-known behavior; they don't warrant a rule change without a broader audit of similar cases across the corpus.
