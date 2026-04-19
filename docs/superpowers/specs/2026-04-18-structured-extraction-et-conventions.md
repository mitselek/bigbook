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

**Wave 4 refinement — preserve line-end U+002D in ET.** When U+002D DOES appear at an ET line-end (rare), it is almost always an authored compound hyphen being split across lines, NOT a typesetter artifact. Examples: `Võib-` + `olla` → `Võib-olla`. Unlike EN (where line-end U+002D defaults to strip-and-join with a narrow allowlist), **in ET, preserve line-end U+002D and join without space**. The EN compound-prefix allowlist is inapplicable either way.

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

**ET drop rule:** `y0 < 45 AND (size <= 11.5 OR text.strip().isdigit())`.

**Important — y-gate is `< 45`, not `< 50`.** (Wave 3 finding, arsti-arvamus): 11.5pt body lines can appear at `y = 49` on certain pages. The earlier `< 50` gate false-dropped legitimate body content. Running headers actually sit at `y = 35`, so `< 45` is a safe tighter gate.

Known ET running headers:

- Even pages: `ANONÜÜMSED ALKOHOOLIKUD` (book title)
- Odd pages: chapter title (e.g., `BILLI LUGU`, `LAHENDUS ON OLEMAS`)

## Paragraph boundary via size-band transition (ET — Wave 3 refinement)

In sections with **multi-size body text** (Doctor's Opinion has narrator framing at ~12.5pt and letter/statement body at ~11.5pt), paragraph transitions don't always show x-indent changes. The narrator might hand off to a letter at different y with no indent signal.

**Rule:** flush the current paragraph when font-size changes between adjacent lines, even if x-indent doesn't shift. Apply per section that has multi-size body. Known instance: `arsti-arvamus`.

When this rule fires in the same section, maintain dual paragraph-indent thresholds per size band (e.g. `x >= 64` for narrator 12.5pt; `x >= 76` for letter 11.5pt).

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

**Marker inclusion in text (Wave 4 clarification):** **Keep the marker inside the `text` field.** Examples: `"1. Tunnistasime..."`, `"Üks − Meie ühine hüvang..."`, `"I. Lõplik vastutus..."`. Do NOT strip the marker prefix — downstream consumers can parse it via regex if needed. Stripping loses ordinal context and breaks parity with English.

**Hanging-indent continuation heuristic (Wave 4):** when a non-marker line in list context starts with leading whitespace (raw text begins with `\s+`, not the canonical body-margin indent), it is a continuation of the previous list-item. Observed in `story-ta-alahindas-enda-vaartust` where Six-Step item 2 wrapped onto `     saamine.`. Absorb into the current `list-item` block.

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
- **2026-04-18 (Wave 3 ch02/ch11 + 2 stories + appendix-vii + arsti-arvamus, accepted)**:
  - **Running-header y-gate tightened** from `y0 < 50` to `y0 < 45`. Flagged by arsti-arvamus agent: 11.5pt body lines at `y=49` were false-dropped. Running headers actually sit at `y=35`, making `y < 45` a safe gate.
  - **Size-band transition as paragraph boundary**: for sections with multi-size body (e.g. arsti-arvamus narrator 12.5pt + letter 11.5pt), flush paragraph on size-band change. Apply dual x-indent thresholds per size band.
  - **Three-line heading with disambiguator** (appendix-vii): `VII` / `KAKSTEIST KONSEPTSIOONI` / `(LÜHIKESEL KUJUL)`. Merge all three into a single heading block — matches the English Wave 6 appendix-vii pattern.
  - **Block-count parity with EN** is very strong across Wave 3. ch02, stories, arsti-arvamus all exact matches. ch11 has +15 from Part I opener pages (197-202) that the outline's page range attaches to ch11 but contextually belong to Part II entry — document as known structural seam.
  - **Source quirks preserved**: `KONSEPTSIOONI` vs metadata `Kontseptsiooni` (single S vs with T), `Dave B` vs EN `Dave B.`, `Doktor William D Silkworth` (no period after D) in 2nd byline of arsti-arvamus, ASCII `"` closing quote mixed with `„` opener in `p040` of arsti-arvamus, duplicated clause `Me oleme teiega Vaimses Sõpruskonnas Me ühineme teiega Vaimses Sõpruskonnas` in ch11 p062. All preserved verbatim.
  - **Part I opener pages (pp197-202) attached to ch11** by outline range: 5 part-opener headings + body paragraphs. Structurally transitional; accept as ch11 tail for this pass. Revisit if future needs call for different section boundaries.
- **2026-04-18 (Wave 4 — 12 new + 4 re-runs, accepted)**:
  - **Cross-run repeatability test passed.** Four sections re-extracted blind against backups: ch05 byte-identical (Jaccard 1.00), ch01 99.91% (page-bottom order swap), appendix-i 99.87% (new run caught extra sub-heading, improvement), dr-bob 99.67% (list-item marker variance). Method is highly reproducible; variance sources are documented conventions gaps, not systematic bugs.
  - **Preserve line-end U+002D in ET** (added to cross-line-hyphenation section). Confirmed by `ch06-tegutsema` (`Võib-` + `olla`) and `story-noiaring`. In ET, U+002D at line-end is almost always an authored compound, not a typesetter artifact.
  - **List-item marker inclusion in text** formalized (keep markers IN `text`). Discovered via dr-bob re-run stripping markers that the original preserved. Both agents need consistent guidance.
  - **Hanging-indent continuation heuristic**: non-marker lines with leading whitespace are list-item continuations. From `story-ta-alahindas-enda-vaartust` Six-Steps.
  - **Cross-page terminal-punctuation split may be REQUIRED for ET** (not just optional as in EN). From `story-meie-sober-lounast`: page-top paragraphs at body margin without indent need the terminal-punctuation rule.
  - **En-dash space-padding detection via preceding char** (noiaring): raw line trims trailing whitespace before the dash, so track whether the character BEFORE the dash is a space, not the trailing space.
  - **Page-bottom reading order: footnote before byline** (ch01 re-run finding). Natural reading order places footnotes (page-bottom apparatus) before the final byline (story sign-off at main-body position). Enforce this ordering when both appear on the final page.
  - **Editorial-interlude blockquote confirmed in ET** (`story-anonuumne-alkohoolik-number-kolm` pp220-221). 11 blockquote blocks (vs EN's 12; ET collapses the final 2 into 1 paragraph per source). Size-band transition detection from arsti-arvamus transferred cleanly.
  - **Block-count parity with EN remains near-exact** across all sections extracted. Evidence that the shared schema + ET companion conventions produce a faithful representation of Estonian edition structure.
