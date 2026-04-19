# eessona — Estonian Preface

## Summary

Structured extraction of the Estonian front-matter Preface, pp11-12 (Roman
numerals xi-xii). Emits 7 blocks: 1 heading + 6 paragraphs. Block-count
parity with the EN counterpart (`data/extractions/structured/preface.json`:
also 1 heading + 6 paragraphs). No list-items, verse, footnotes, tables,
or bylines, as expected for a short front-matter preface.

## Method

- PyMuPDF (`pymupdf`) `page.get_text("dict")`, line-level; no pdfplumber.
- Script: `.tmp/extract-eessona.py`. Probe: `.tmp/probe-eessona.py` +
  `.tmp/probe-eessona.txt`.
- Heuristics that fired:
  - Heading detection by `y` + `x>120` (centered) + text-prefix match
    (`EESS…`). Heading font size is 12.5pt here, not 14pt (arsti-arvamus)
    or 13+pt (EN chapters). Size gate was unnecessary given the other
    signals; if future front-matter uses the same pattern, text-match
    remains the most reliable anchor.
  - Drop-cap detection by font `BrushScriptStd` + `size >= 20`
    (`S` at 33pt, x=56.7, y=113.5). Merge into first body line's start
    (`S` + `ee on raamatu…` → `See on raamatu…`), per ET convention of no
    small-caps tail.
  - ET running-header drop gate `y0 < 45 AND (size <= 11.5 OR digit OR
    roman)`. Both `EESSÕNA` running title and `xii` roman page number at
    y=35 on p12 are dropped by `size <= 11.5`. Bottom page number `xi` on
    p11 at y=530.8 is dropped by the `y0 > 520 AND size <= 11.5 AND roman`
    gate.
  - Body is single-size (~12.5pt). No size-band transitions (the Wave 3
    arsti-arvamus multi-size rule does not fire here).
  - Paragraph indent threshold `64 <= x0 < 96`. Body margin is x=56.7,
    indent is x=68.0.
  - **Drop-cap wrap-zone exclusion**: the first paragraph's first two body
    lines sit at x=83.6 (indented beyond body margin) because they wrap
    around the 33pt drop-cap glyph. Without an exclusion, they would be
    misread as paragraph-starts. The script computes a y-band for the
    drop-cap (`y = dropcap.y0 - 5 … dropcap.y0 + 1.2 * size`) and excludes
    lines inside that band with `x0 >= 78` from paragraph-start detection.
  - **Cross-page paragraph merge** (front-matter style, terminal-punctuation
    heuristic): p11 last body line ends with `lisati` (no terminal punct)
    so the paragraph continues to p12 L0.0 (`kolmkümmend täiesti uut lugu;
    ning …`). This works out of the normal flow because p12's first body
    line is at x=56.7 (body margin, not paragraph indent) — `is_start` is
    False, so the line appends to the current open paragraph that carried
    across from p11. No special code needed.
  - Soft hyphen (U+00AD) strip-and-join at join time (ET convention). ~8
    cross-line breaks, all via U+00AD, zero via U+002D hyphen-minus.

## Schema decisions

- **Drop-cap merge**: `S` + `ee` with NO space, producing `See`. Standard
  ET drop-cap rule: no small-caps tail, body continues lowercase directly.
- **No `byline` block** emitted. The preface is anonymous/editorial; the
  EN counterpart also has no byline. Correct for both.
- **Heading text** preserved as ALL-CAPS `EESSÕNA` (source visual rendering)
  vs metadata `title: "Eessõna"` (prose-case). Matches the intentional
  divergence documented in the shared conventions.
- **No drop-cap/lead-in-cap** of the EN small-lead-in-cap variety (e.g.
  EN Preface's `T` + `HIS IS ` small-caps). ET just uses the BrushScriptStd
  single-letter decorative drop-cap as in ch01/arsti-arvamus; no small-caps
  tail to flatten.

## Flagged blocks

- **`eessona-p003`** — contains a source-text duplication:
  `"…just nagu see nagu see pandi kirja 1939. aastal…"`. The words `nagu
  see` appear twice in the PDF (L2.7 end + L2.8 start). Preserved verbatim
  per ET "fidelity to source beats grammatical correctness" convention.
  Matches the duplicated-clause pattern documented in Wave 3 for
  `ch11 p062` and the repeated-word pattern in `appendix-i long-form`.
- **`eessona-p003`** — `William D Silkworthi` (no period after D). Matches
  the Wave 3 arsti-arvamus byline quirk (`Doktor William D Silkworth`).
  Preserved.
- **`eessona-p007`** — the closing paragraph's final quote uses the
  Estonian `„…”` pair throughout. All three quoted fragments (`"Jah, ka
  minuga juhtus nii"`, `"Jah, minagi olen nii tundnud"`, `"Jah, usun, et
  see programm võib ka minu jaoks töötada."`) close with `”` (U+201D),
  consistent with ET convention. No mixed-quote artifact here (unlike
  arsti-arvamus p040 which had `"` closing an Estonian open-quote).

## Schema proposals

None. All rules needed were already in the shared + ET conventions docs.
The drop-cap wrap-zone exclusion (y-band of the drop-cap + x>=78) is a
local implementation detail; the general principle (narrow-glyph wrap-
zone x-offset) is already documented.

## Drop-cap / lead-in-cap verdict

- **Drop-cap present**: `S` in BrushScriptStd at 33pt, x=56.7, y=113.5.
  Merged into the first paragraph's opening word as `See`.
- **No small-caps lead-in tail** (ET divergence from EN).
- **Wrap zone**: two body lines (L1.0 at y=117.6 and L1.1 at y=132.1, both
  at x=83.6) wrap around the drop-cap. Folded into the first paragraph as
  continuation lines, not treated as paragraph-starts.
