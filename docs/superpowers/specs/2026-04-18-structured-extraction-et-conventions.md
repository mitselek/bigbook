# Structural-extractor conventions — Estonian companion

**Date:** 2026-04-18
**Status:** Living document — evolves as waves complete.
**Parent:** `2026-04-18-structured-extraction-conventions.md` (English, shared baseline).

This document records **Estonian-only** rule additions and refinements. Anything applicable to both languages goes in the parent conventions doc. Read the parent doc first, then apply the additions below for ET sections.

## Schema

Unchanged from parent. Same `BookSection` / `Block` shape, same `BlockKind` values.

## Text normalization (ET additions)

- **Estonian diacritics** — `õ`, `ä`, `ö`, `ü` (and capitals `Õ Ä Ö Ü`): preserve as-is. These are authored content, not typographic artifacts. PyMuPDF delivers them as Latin-Extended-A/-B codepoints. Verified clean in Wave 1 pilot (ch01-billi-lugu).
- **Ligatures** — same as EN (U+FB01 `ﬁ` → `fi`, etc.). Verified in pilot.
- **Estonian curly quotes** — the Estonian typesetter uses `„` (U+201E DOUBLE LOW-9) and `”` (U+201D RIGHT DOUBLE QUOTATION MARK), different from the English `"` / `"` (U+201C / U+201D). Both pairs must be **preserved as authored**. Do not flatten to ASCII.

## Cross-line hyphenation (ET refinement — MAJOR divergence from EN)

**Finding from Wave 1 (ch01-billi-lugu):** Estonian encodes cross-line word splits using **U+00AD SOFT HYPHEN**, not U+002D hyphen-minus. In our pilot section, 104 cross-line splits used soft hyphen; zero used U+002D. This is a fundamental typesetter difference.

**Rule:** keep soft hyphens in the line-text until **join time**, then strip and join without space.

```python
# WRONG — pre-normalization strip loses the join signal:
#   line_text = line_text.replace('\u00AD', '')
#   → produces 'saabu nud' (space remains from line break)
#
# RIGHT — soft-hyphen survives into the line-join step:
def join_lines_et(prev, curr):
    if prev.endswith('\u00AD'):
        return prev[:-1] + curr  # strip soft hyphen + join no-space
    if prev.endswith('-'):
        # U+002D hyphen — apply the EN allowlist rules (rare in ET)
        ...
    return prev + ' ' + curr
```

**Consequence:** the EN compound-word allowlist (`self-`, `well-`, `co-`, `one-`..`ten-`, ordinal decades, `pseudo-`, `so-`, etc.) is **not applicable to ET**. The EN rules target U+002D line-breaks; Estonian doesn't use them for typesetting.

**Seed ET allowlist:** empty. Strip-and-join default applies to all cross-line soft hyphens.

**Real U+002D hyphens in ET body text**: present but intra-line only (e.g., `Uus-Inglismaa`, `AA-le`, `pastori-poeg`). These are authored compound-hyphens and are preserved as-is because they don't appear at line-end.

## Em-dash / en-dash (ET refinement)

Estonian uses **U+2013 EN-DASH** and sometimes **U+2212 MINUS SIGN** for mid-sentence dashes, **not** U+2014 EM-DASH (which is the English convention). These characters appear **space-padded** in Estonian prose (`ja nii – mina pöördusin` with spaces on both sides of the dash).

**Rule inverts the EN em-dash rule**: when an en-dash or minus-sign appears at a line break WITH surrounding spaces (signaling space-padded usage), join **with a space**. When it appears tight (no surrounding spaces), join without a space.

```python
# Track trailing space BEFORE rstrip to distinguish
if prev_line.rstrip().endswith(('\u2013', '\u2212')):
    # Check whether the original line had a trailing space before the dash
    if prev_line.endswith(('\u2013 ', '\u2212 ')):
        return prev_line + curr  # space-padded, preserve
    else:
        return prev_line + curr  # tight, no space
```

## Running headers (ET refinement)

Estonian running headers render at **11pt NewCaledonia**, not 9pt as in English. The EN drop rule `y0 < 50 AND size <= 9.5` misses them.

**ET drop rule:** `y0 < 50 AND (size <= 11.5 OR text.strip().isdigit())`.

Known ET running headers:

- Even pages: `ANONÜÜMSED ALKOHOOLIKUD` (book title)
- Odd pages: chapter title (e.g., `BILLI LUGU`, `LAHENDUS ON OLEMAS`)

## Drop-cap (ET refinement)

Estonian book uses **BrushScriptStd at ~33pt** (not ParkAvenue at ~51pt as in EN). Detection:

- Font name: `BrushScriptStd` (or any font distinct from body `NewCaledoniaLTStd`)
- Size: ≥ 20pt (wider than body)
- Position: top-left of first body paragraph

**No small-caps tail** after the ET drop-cap — the body text continues at normal size directly. This is simpler than the EN pattern (where the drop-cap is followed by a small-caps run).

**Narrow-glyph wrap-zone** (narrow `I`, `J`) rule from parent EN conventions still applies — use `+20` x-offset vs `+35` for wide glyphs.

## "Chapter N" label (ET refinement)

Estonian form: `N. peatükk` (e.g., `1. peatükk`, `5. peatükk`), set in **italic 12.5pt NewCaledonia-Italic**. Drop per the parent convention (same as EN's `Chapter N`).

Detection regex: `^\d+\.\s*peatükk\s*$` (case-insensitive).

## Text quirks to preserve verbatim (not bugs, do not fix)

Discovered in Wave 1:

- **`o1i`** in the ch01 footnote (should be `oli`) — PDF OCR-ish artifact. Preserve verbatim.
- **`sõruskonna`** (should be `sõpruskonna`) — source typo on p.48. Preserve.
- **`Bill W,`** (no period) in ch01 byline — diverges from EN's `Bill W.,`. Preserve.

Pattern: if the PDF renders a character, preserve it. Fidelity to source beats grammatical correctness.

## List-item prefix conventions (ET)

Estonian uses **two marker styles** depending on context:

- **Word cardinals** (used in appendix-i short-form Twelve Traditions): `Üks`, `Kaks`, `Kolm`, `Neli`, `Viis`, `Kuus`, `Seitse`, `Kaheksa`, `Üheksa`, `Kümme`, `Üksteist`, `Kaksteist`. Detection: word at line-start followed by `−` (minus sign with spaces).
- **Arabic numerals** (used in the Twelve Steps, long-form Twelve Traditions, Twelve Concepts): `1.`, `2.`, ..., `12.`. Detection: `^\d{1,2}\.\s` at line start.

**Item separator in ET is U+2212 MINUS SIGN with surrounding spaces** (`−`), not em-dash. This matches the ET mid-sentence dash convention.

## TOC-on-appendix-opening pattern (ET)

The first appendix page (`appendix-i-aa-traditsioonid`, p593) opens with a `LISAD` heading followed by a **7-row roman-numeral table-of-contents** listing all appendices (I-VII). This pattern may recur on other appendix openers.

- Emit the `LISAD` as a `heading` block.
- Emit the 7-row TOC as a `table` block with 2 columns (roman numeral, title), rows × cells.
- **Two-column TOC row-pairing**: sort each column by y-coordinate, then zip. Do NOT y-proximity match — different columns can have different line leadings (observed: 12pt vs 14.5pt), so dy-matching fails after the first few rows.

## Evolution log

- **2026-04-18 (outline built, pilot dispatched)** — initial ET conventions seeded empty. All rules from the parent EN conventions apply as baseline.
- **2026-04-18 (Wave 1 ch01-billi-lugu, accepted)**:
  - **U+00AD SOFT HYPHEN is the ET cross-line mechanism** — major finding. 104 cross-line splits in ch01, all via soft hyphen. EN compound-word allowlist is inapplicable to ET. Strip-and-join at join time, not during pre-normalization.
  - **ET running headers at 11pt** (not 9pt). Relax drop gate from `size <= 9.5` to `size <= 11.5`.
  - **ET en-dash / minus-sign** (U+2013 / U+2212) replace EN em-dash. Space-padded; join with space if surrounding-space detected.
  - **Drop-cap BrushScriptStd at ~33pt** (not ParkAvenue at 51pt). Detection threshold: size ≥ 20pt in non-body font.
  - **Chapter label `N. peatükk`** — drop via regex `^\d+\.\s*peatükk\s*$`.
  - **No ET-specific compound allowlist needed** (seed empty; soft-hyphen mechanism makes it unnecessary).
  - **Hampshire Grenadier verse present in ET** (translated), emitted as `verse` block with 6 lines and ET curly quotes `„...”`.
  - **Source artifacts preserved verbatim**: `o1i`, `sõruskonna`, `Bill W,` (no period). Document as quirks, not bugs.
- **2026-04-18 (Wave 2 ch05 + dr-bob + appendix-i, accepted)**:
  - **ET list-item marker styles documented**: word cardinals (`Üks`..`Kaksteist`) for appendix-i short-form; Arabic numerals (`1.`..`12.`) for Twelve Steps, long-form Traditions. Item separator is `−` (U+2212 MINUS SIGN with spaces), not em-dash.
  - **TOC-on-appendix-opening pattern documented**: `LISAD` heading + 7-row roman-numeral table on appendix-i's first page. Two-column TOC pairing uses sort-then-zip per column, not y-proximity.
  - **No abbreviation expansion in ET headings**: confirmed via dr-bob (`DOKTOR` stays `DOKTOR`, not abbreviated to `Dr.`). Estonian source typically uses full word forms; the EN pattern of abbreviation expansion (`Dr.` → `DOCTOR`) does NOT apply.
  - **Block-count parity with EN**: ch05 both 61 blocks, dr-bob both 39 blocks, appendix-i ET 33 vs EN 32 (+1 for the LISAD TOC on p593). Strong cross-language structural alignment validates the shared schema.
  - **Source quirks preserved** in appendix-i long-form: duplicated word `heaolu, heaolu`, truncated continuation fragment `simustes...`, heading singular `TRADITSIOON` vs plural elsewhere. Fidelity-over-correction maintained.
