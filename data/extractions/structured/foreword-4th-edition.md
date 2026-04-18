# foreword-4th-edition — extraction report

## Summary

Two-page front-matter foreword (PDF pp. 12-13). Emitted **5 blocks**: 1 heading + 4 paragraphs. Zero list-items, verse, footnote, byline, table, blockquote. Extraction is clean; one cross-page paragraph merge fired (p005 spans pp. 12→13). JSON validated with `json.load()`.

## Method

- **PyMuPDF** only (`page.get_text("dict")`). Script: `.tmp/extract-foreword-4th.py`.
- Probe: `.tmp/probe-foreword-4th.py`.

### Heuristics fired

- **Heading detection** — page 12, size ≥ 12.5, line contains `FOREWORD`. Matches at y=45.10, size=13.02, NewCaledonia. Heading text has a trailing single-space span in NewCaledonia 10.98 that I dominate-by-max-size over for classification.
- **Running-header drop** — `y0 < 50 AND (size <= 9.5 OR digit-only)` with an exemption for lines containing `FOREWORD`. The heading sits at y=45.10 but is size 13.02, so it passes naturally; the exemption is defensive.
- **Paragraph split by y-gap on a single page** — intra-paragraph line spacing ~13.3 pt, inter-paragraph gap ~27 pt. Threshold 20 pt splits cleanly between paragraphs 1/2 (y=144.46 → 172.07, gap 27.6), 2/3 (y=265.32 → 292.62, gap 27.3), and 3/4 (y=453.13 → 480.37, gap 27.2).
- **Cross-page paragraph merge (front-matter terminal-punctuation heuristic)** — page 12's last body line at y=533.54 reads `"...computers can participate "` and does NOT end with terminal punctuation, so the line at y=45.16 on page 13 is treated as continuation. Merge fired, producing coherent `p005`: `"…can participate in meetings online, sharing with fellow alcoholics…"`.
- **Ligatures / NUL / soft-hyphen** — `normalize_text()` applied; none observed in the raw spans of this section.

### Cross-line hyphenation

None fired. No line ended with `-`. The visible hyphens in the emitted text (`quarter-century`, `Modem-to-modem`, `face-to-face`) were all intra-line in the PDF, so the cross-line rule didn't need to act.

## Drop-cap verdict

**Small front-matter lead-in cap**, handled by PyMuPDF's natural span concatenation. The first body line on page 12 at y=75.07 is a composite:

- span 1: `'T'` in ParkAvenue 16.02 pt (the lead-in cap).
- span 2: `'HIS fourth edition of '` in NewCaledonia 10.98 pt.
- subsequent inline spans: ArialMT 10.98 pt opening/closing curly quotes around `Alcoholics Anonymous`.

PyMuPDF concatenated these at the line level into `'THIS fourth edition of "Alcoholics Anonymous" came off '`. No special-case join code needed. This is the same pattern as foreword-1st-edition's `'W' + 'E, OF ...'` → `'WE, OF …'`.

Compared to foreword-2nd-edition's `SINCE the original Foreword...` (the full first line is ParkAvenue 18pt), foreword-4th-edition uses only a single-letter lead-in cap (`T`) rather than a full decorative opening line.

## Schema decisions

1. **No italic deck present** on this page, unlike foreword-2nd-edition. Section heading is immediately followed by the first body paragraph. No extra paragraph block emitted.

2. **Title divergence preserved.** Section metadata `title` = `Foreword to Fourth` (prose-case); heading block text = `FOREWORD TO FOURTH EDITION` (visual rendering from the PDF). Per conventions.

3. **Cross-page paragraph merge** used the front-matter terminal-punctuation rule (p005 last line on page 12 ends `"can participate "` without terminal punctuation → merge). This is the heuristic documented in the conventions doc for front-matter sections with no first-line indent.

4. **Pagination tagging.** `pdfPage` on a paragraph reflects the page on which the paragraph starts. `p005` starts on page 12 and continues onto page 13; it is tagged `pdfPage: 12`. This matches the behavior in foreword-2nd-edition and other front-matter sections.

## Flagged blocks

None. Every block is confident. No cross-line hyphenation artifacts, no ambiguous verse candidates, no footnotes. The body prose is straightforward.

- `h001` — heading `FOREWORD TO FOURTH EDITION`.
- `p002` — paragraph with lead-in cap (page 12, single paragraph ending `"…approximately 150 countries around the world."`).
- `p003` — paragraph (page 12, ending `"…translated into forty-three languages."`).
- `p004` — paragraph (page 12, longest of the four, ending `"…first 100 members could have hoped to reach."`).
- `p005` — paragraph spanning pp. 12→13, ending `"…language of the heart in all its power and simplicity."`.

## Schema proposals

None. Existing schema and conventions handle this section cleanly.

## Block counts by kind

| kind | count |
| --- | --- |
| heading | 1 |
| paragraph | 4 |
| list-item | 0 |
| verse | 0 |
| footnote | 0 |
| byline | 0 |
| table | 0 |
| blockquote | 0 |
| **total** | **5** |

## Heading text emitted

`FOREWORD TO FOURTH EDITION`

## Other notes

- **Em-dashes** appear in `p004` (`"characteristics—of age, gender, race, and culture—have"`) — preserved as `\u2014`, no surrounding spaces inserted (both em-dashes are intra-line in the source).
- **Curly quotes** preserved throughout (`"…" / '`).
- **No ligatures** observed in the raw spans.
- **No running headers or page numbers** on these two pages (typical of front-matter in this PDF).
- **Hyphenated compounds** appear as-is: `quarter-century`, `Modem-to-modem`, `face-to-face`. All intra-line in source.
