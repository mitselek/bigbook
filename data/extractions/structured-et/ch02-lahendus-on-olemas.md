# ch02-lahendus-on-olemas — extraction report

## Summary

Extracted "Lahendus on olemas" (ET "There Is a Solution"), PDF pages 49–61
(book pages 17–29). Emitted **55 blocks**: 1 heading, 52 paragraphs, 2
footnotes. Zero verse (matches chapter's prose character and task note).
Structural parity with EN ch02 (55 blocks: 1h / 52p / 2f).

## Method

- **PyMuPDF** `page.get_text("dict")` only. No `pdfplumber`.
- Drop-cap detection via non-body font `BrushScriptStd` at size ≥ 20 on page 49.
- Heading detection: size ≥ 13.0 on page 49, text starts with `LAHENDUS`.
- Chapter label `2. peatükk` dropped via regex on italic 12.5pt line (page 49).
- Running-header drop: `y0 < 50 AND (size <= 11.5 OR digit-only)` per ET rule.
- Bottom page-number drop: `y0 > 520 AND size <= 11.5 AND digit-only`.
- Footnote detection: `Times...-Italic` font at size ≤ 10.5, `y0 > 500`.
- Line-join heuristics per ET conventions (`join_paragraph_lines`):
  - Soft hyphen (U+00AD) at end → strip and join.
  - U+002D hyphen + next lowercase → strip and join (ET default, no allowlist).
  - En-dash / minus-sign → ET space-padded style; preserve surrounding space.
  - Em-dash (defensive; not used in this ET section).

## Schema decisions

### Drop-cap
Page 49 drop-cap `M` (BrushScriptStd 33pt) at x=56.7, y=119.3. The first body
line wraps around the glyph at x≈100.1, y=123.3 ("eie, anonüümsete..."). The
second wrap line at x≈100.1, y=137.8 continues the same paragraph. Merged
`M` + `eie, anonüümsete...` → `Meie, anonüümsete...`. Drop-cap wrap-zone
defined as page 49 && y ≤ 145 && x ≥ 90 so the second wrap line is not
mistakenly treated as a new paragraph start.

### Italic pull-quote paragraphs
Three italic passages (NewCaledoniaLTStd-It) appear in body prose:

- **p50 y=324–382** — "Kuid endine probleemne jooja..." — captured as block
  `p008`, a single paragraph (own first-line indent at x=68). Kept inline per
  convention (italics alone is weak split signal, and it has normal paragraph
  indent). This corresponds to EN p008 which is also a regular paragraph.
- **p56 y=150–223** — "Fakt on see, et enamik alkohoolikuid..." — captured as
  block `p030`, single paragraph. Same rationale.
- **p57 y=121.4** — "Lahendus on olemas." (single italic line, title-echo) —
  merged into block `p034` as the opening phrase of the following paragraph
  (same paragraph indent). This also mirrors EN p034 which opens with "There
  is a solution." inline.

### Footnotes
Two footnotes (Times italic 10pt, page-bottom):

- `f054` on page 57: `*Põhjalikult lahti seletatud – Lisa II`
  — references the `*` embedded mid-word in p035 (`kogemusi*`, Times Roman
  12.57pt at y=323).
- `f055` on page 59: `*Täpsemalt – vaata Lisa II.`
  — references the `*` at end of dialogue in p044 (`alkohoolikuga.”*`).

Asterisk cross-reference preserved in body text per Wave 1B convention.

### Dialogue / doctor's testimony
Per task note, the doctor-patient dialogue passages on pages 58–59 are
kept as ordinary `paragraph` blocks (one per speech turn), not `blockquote`
or `verse`. This includes:

- `p042` Arst's first speech ("Teil on kroonilise alkohooliku mõtteviis...")
- `p043` Patient's question ("Kas erandeid ei olegi?")
- `p044` Arst's long reply (the quoted paragraph that ends with the footnote ref)

Matches EN p042/p043/p044 structure exactly.

### Chapter label
`2. peatükk` (italic 12.5pt NewCaledoniaLTStd-It at y=69.1 on page 49) dropped
via standard ET regex `^\d+\.\s*peatükk\s*$`. No heading block synthesized for
it — the chapter's semantic heading is `LAHENDUS ON OLEMAS`.

## Verse verdict

**Zero verse.** As expected per the task note. The chapter contains no verse
at all — no epigraphs, no set-off quoted poetry, no centered short-line
passages. Dialogue passages and italic pull-quotes kept in `paragraph` per
convention.

## Drop-cap verdict

**One drop-cap found and merged.** BrushScriptStd `M` at 33pt on page 49 at
x=56.7, y=119.3. Merged into the first paragraph as `Meie, anonüümsete...`.
Wrap-zone for the first and second wrapped lines (x≈100.1) handled
explicitly so those lines do not trigger false paragraph-start detection.

## Block counts

| Kind       | Count |
|------------|------:|
| heading    |     1 |
| paragraph  |    52 |
| footnote   |     2 |
| **Total**  | **55** |

Structural parity with EN ch02 (also 1/52/2 = 55).

## Uncertainties / notes

- None flagged. Clean extraction. No soft-hyphen remnants in output. No NUL
  bytes. All Estonian diacritics preserved. Estonian curly quotes
  (`„` / `”`) preserved in dialogue passages (p016, p032, p042, p044, etc.).
- In-body asterisk cross-references kept for both footnotes.
- Two italic pull-quote paragraphs (p008 and p030) kept inline as their own
  paragraph blocks — same decision path as EN counterpart.
