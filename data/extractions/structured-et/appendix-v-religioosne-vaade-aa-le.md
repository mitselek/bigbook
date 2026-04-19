# appendix-v-religioosne-vaade-aa-le — extraction report

## Summary

Single-page ET appendix (PDF p604 / book p572). Clean one-to-one parity with
the English counterpart (`appendix-v-the-religious-view-on-aa`): 7 blocks total
— 1 heading, 5 paragraphs, 1 footnote. No ambiguous structures, no source
quirks that required judgment calls.

Heading text (merged from two centered lines): **`V RELIGIOOSNE VAADE AA-LE`**.

## Method

- Library: PyMuPDF (`page.get_text("dict")`). Script at
  `.tmp/extract-appendix-v-et.py`, probe at `.tmp/probe-appendix-v-et.py`.
- Single page → no cross-page merge heuristics required.
- Heading detection: size ≥ 13.5 AND y0 ≤ 90 on p604 → two lines (`V` at
  y=48.66 size 14.0, `RELIGIOOSNE VAADE AA-LE` at y=61.66 size 14.0). Merged
  into one heading block with `" "` separator per parent-conventions
  "appendix two-line heading" rule.
- Page-number drop: `'572'` at y=530.79 dropped via `stripped.isdigit() AND
  size <= 11.5 AND y0 > 520`.
- Paragraph boundaries: first-line indent at x ≥ 64 (indent column is 68.03;
  wrap column is 56.69). Standard chapter/appendix layout.
- Footnote: line starting with `*` at y > 440 (actual y = 453.33) is the seed;
  all following lines on the same page at or below y_seed are absorbed into
  the footnote block (catches the single continuation line at y = 467.39).
  Marker `*` preserved as first char; `*X` → `* X` normalization for EN parity.
- ET line-join: soft-hyphen strip-and-join (11 U+00AD instances across
  paragraphs p003/p004/p005/p006), en-dash space-padding preserved via the
  `prev_had_trailing_space` flag.

## Schema decisions

- **Heading merge** — two lines joined with a space (`V RELIGIOOSNE VAADE AA-LE`).
  Matches EN (`V THE RELIGIOUS VIEW ON A.A.`) and the appendix-heading
  convention (`I THE A.A. TRADITION` / `II VAIMNE KOGEMUS`).
- **Footnote ordering** — placed after all body paragraphs via sort-rank.
  The footnote's y-coordinate (453.33) actually falls between body paragraphs
  (the preceding p006 ends at y≈441, the fn at y=453, no body after it), so
  rank-based sort is defensive only; here y-ordering would produce the same
  result. EN output also ends with `f007`.
- **Footnote marker normalization** — raw text is `*Kirikuisa Ed, ...`
  (no space after the marker). Applied `*X` → `* X` via regex to match the
  EN output style (`* Father Ed, ...`) and the Wave-3 appendix-iii precedent.

## Line-join evidence (soft-hyphen strip-and-join fired)

- p003: `sel-` + `lele` → `sellele`; `süm-` + `fooniates` → `sümfooniates`;
  `katoliik-` + `laste` → `katoliiklaste`; `alandus ja sel-` split at mid-word.
- p004: `toimetus-` + `liku` → `toimetusliku`; `ise-` + `äraliku` → `iseäraliku`.
- p005: `tutvus-` + `tas` → `tutvustas`.
- p006: `kopee-` + `rida` → `kopeerida`; `pais-` + `tab` → `paistab`;
  `kujut-` + `lusvõimet` → `kujutlusvõimet`.

All 11 soft hyphens stripped cleanly. The en-dash in p006 (`käsitletakse –
ja ta pais-`) has surrounding spaces in the source and is preserved as
`käsitletakse – ja ta paistab`.

## Flagged blocks

None. Every block is unambiguous and matches EN structure 1:1.

Minor source-fidelity note (not a bug to fix):

- `John D Rockerfeller Jr-i` in p005 — this is the ET spelling as printed
  (EN has `John D. Rockefeller Jr.`). The ET edition omits the period after
  `D` and spells the surname with `kerf` instead of `kef` (`Rockerfeller` vs
  `Rockefeller`). Both quirks preserved verbatim per ET fidelity-over-
  correction convention.
- `suurepärana` in the footnote (f007) — the ET edition prints it thus; the
  grammatically expected form would be `suurepärane`. Preserved verbatim.
- `ilme` in p004 — the ET edition prints `oleksid ilme selle iseäraliku`
  where `ilma` (without) would read naturally. Preserved verbatim.

## Schema proposals

None. Existing conventions handle this section end-to-end:

- Parent EN: two-line appendix heading merge, footnote marker preservation,
  page-number y-bottom drop, first-line-indent paragraph boundary.
- ET companion: soft-hyphen strip-and-join, en-dash space-padding,
  11pt-body running-element drop gate.

## Counts

| kind       | count |
| ---------- | ----- |
| heading    |   1   |
| paragraph  |   5   |
| footnote   |   1   |
| **total**  | **7** |

Exact block-count parity with EN `appendix-v-the-religious-view-on-aa` (7 blocks).
