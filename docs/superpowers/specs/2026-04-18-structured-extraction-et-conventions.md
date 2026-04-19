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
