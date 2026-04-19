# story-noiaring

Wave 4 Estonian per-section extraction.

## Summary

Extracted the fifth Pioneers-of-AA personal story in the Estonian edition
(ET ordering). English counterpart: `story-the-vicious-cycle`. Pages 251–263
in the PDF, book pages 219–231. Emitted **28 blocks** total:

- 1 heading
- 27 paragraphs
- 0 list-items, 0 bylines, 0 verses, 0 footnotes, 0 blockquotes, 0 tables

The EN counterpart also emits 28 blocks with the same kind distribution
(1 heading + 27 paragraphs, no byline). ET matches EN exactly on
block-structure granularity.

## Method

Single-pass PyMuPDF `get_text("dict")` over pages 251..263 (1-indexed).
Lines sorted by `(pdf_page, y0, x0)` for reading order.

Running headers / page numbers dropped with the ET-refined Wave 3 rule
`y0 < 45 AND (size <= 11.5 OR pure digits)`. Bottom page number (p251
only) dropped with `text.isdigit() AND size <= 11.5 AND y0 > 520`.
Story-number prefix `(5)` dropped by regex `^\(\d+\)\s*$` gated to
`pdf_page == 251 AND y0 < 60` (sits centered above the heading at
y ≈ 47.5, x ≈ 187, size 13.0).

ET soft-hyphen (U+00AD) handling uses the Wave 1 join-time rule: strip
the soft hyphen when joining prev+curr, no space inserted. The source is
heavily soft-hyphenated (visible as `\xad` glyphs in the probe); all
joined cleanly — 0 residual soft hyphens in output text.

Paragraph-start detection: `x0 >= 64.0` (body margin ~56.7, first-line
indent ~68.0).

Drop-cap merge: `8.` (BrushScriptStd, size 33, at x=54.7 y=140) merged
with the first body line `jaanuar 1938 – see oli minu põhi. Asukohaks`
at (x=88.9, y=144.5). The drop-cap is a **two-character glyph** (`8.`
— digit plus period), not a single letter. Join inserts a space:
`8.` + ` ` + `jaanuar ...` → `8. jaanuar 1938 – see oli minu põhi.`
This matches the semantic `January 8, 1938` date format in the EN
counterpart (`story-the-vicious-cycle`). Drop-cap wrap-zone:
y ∈ [155, 170] AND x0 ≥ 85 stays in the first paragraph — captures the
second wrap-indent line at (y=159, x=88.9).

Italic deck: 3 italic lines on p251 (y=92..121) grouped into a SINGLE
paragraph — only one first-line indent (y=92 x=68); subsequent lines sit
at body-margin x=56. Matches EN counterpart's single-paragraph deck.

## Schema decisions

1. **Heading visual form**: `NÕIARING` — preserved the PDF's visual
   all-caps rendering. The section metadata `title` uses prose-case
   (`Nõiaring`) but the heading block emits the visual heading (all-caps,
   size 14.0 NewCaledoniaLTStd at y=66.6). Honors the title-vs-heading
   divergence documented in parent conventions.

2. **parentGroup**: `personal-stories/pioneers-of-aa` preserved from
   section metadata.

3. **Story-number prefix `(5)` dropped**: the numeric story-number at
   page 251 y=47.5 size=13.0 centered (x=186.6) is NOT emitted — per
   parent conventions: "Lean toward DROP — it is structural numbering,
   not authored content." Matches the EN counterpart's handling
   (`story-the-vicious-cycle` also drops its `(11)` prefix).

4. **Italic deck → 1 paragraph**: only one first-line indent observed
   (y=91.7 x=68.0), so emitted as a single paragraph per conventions
   default. EN counterpart also emits a single deck paragraph.

5. **Drop-cap `8.`** (two-glyph): BrushScriptStd 33pt. Unusual for ET
   stories — most stories use a single-letter drop-cap. The `8.` functions
   as part of a date: the body begins `jaanuar 1938 – see oli minu põhi`
   (`January 8, 1938 – that was my bottom`). Merge inserts a space
   between `8.` and the first body word because `8.` is a complete
   token (digit + period), not a word-initial letter. This follows the
   Wave 2 dr-bob precedent: "when the drop-cap is a standalone ... word
   ... insert a space."

6. **Dash-join refinement** (see Flagged blocks below): extended the ET
   en-dash / minus-sign line-end join rule to detect space-padding via
   the char PRECEDING the dash in addition to the trailing-space check.

7. **No byline**: neither the EN nor ET version of this story has an
   author sign-off. The story ends on the reflective sentence
   `Ja ma ütlen ikka, et seni, kuni ma mäletan 8. jaanuari Washingtonis,
   nii kaua säilitan ma Jumala armust, nagu mina teda mõistan, oma
   õnneliku kainuse.` as the final paragraph block (`p028`).

8. **No footnotes, verses, blockquotes, lists, or tables** observed in
   this section.

## Flagged blocks

**`p006`** contains an authored em-dash (U+2014) mid-sentence:
`Jackie rääkis mulle New Yorgis asuvast rühmast, kuhu kuulus ka mu
vana sõber Fitz—mehed, kel oli sama probleem nagu minul`. The em-dash
is **not** converted to ET's usual en-dash — the PDF source renders
U+2014 here tight-joined to the surrounding words (`Fitz—mehed`), not
as a space-padded mid-sentence dash. Preserved verbatim per the
source-fidelity convention. This is the ONLY em-dash in the section.

**`p006`** also contains a line-end en-dash case that required a
minor rule refinement: the raw source line at (p252 y=280.91) ends
with `... kõrvale –` (space before the dash but the trailing space
was trimmed by line-end truncation); the next line begins `see ...`.
The original ET dash rule only checked for a trailing space after the
dash to detect space-padding. That missed this case — join produced
`kõrvale –see` instead of `kõrvale – see`. Refinement: also check
whether the character **preceding** the dash is a space; if so, treat
as space-padded. Output now reads
`... selle kõrvale – see oli minu jaoks täielik jama.` This is a
proposed ET conventions addition (see Schema proposals).

**`p010`** contains a suspended-list construct split across lines:
`... ei ole mu õde elus tilkagi alkoholi pruukinud.` on p253 following
`alko\xadhoolikud – ja üks neist sellesse suri – ei ole mu õde`.
The en-dashes in `– ja üks neist sellesse suri –` are correctly
space-padded in the joined output.

## Dash verification

This section is dash-heavy. All mid-sentence dashes verified:

- U+2013 EN-DASH: 24 occurrences, all properly space-padded
  (except `Fitz—mehed` which uses U+2014)
- U+2212 MINUS SIGN: 1 occurrence (`vale ja − kerigu põrgu` in p018,
  space-padded)
- U+2014 EM-DASH: 1 occurrence (`Fitz—mehed` in p006, preserved
  verbatim — rare ET source quirk)
- U+00AD SOFT HYPHEN: 0 leaked into output (all resolved at join)

## Cross-line hyphenation audit

Soft-hyphen joins spot-checked (no residual U+00AD in output):

- `juhtu-` + `nud` → `juhtunud` (p003, within drop-cap paragraph)
- `väike-` + `sesse` → `väikesesse` (p004)
- `Balti-` + `more` → `Baltimore` (p009)
- `alko-` + `hoolikud` → `alkoholikud` (p010)
- `vis-` + `kamist` → `viskamist` (p012)
- `rea-` + `mehena` → `reamehena` (p012)
- `Prantsus-` + `maad` → `Prantsusmaad` (p012)
- `autopoleerimis-` + `firma` → `autopoleerimisfirma` (p020)
- `kaheteist-` + `kümnest` → `kaheteistkümnest` (p021)
- `nädala-` + `vahetusel` → `nädalavahetusel` (p019, p022)
- `meele-` + `olus` → `meeleolus` (p023)
- `välja-` + `kutse` → `väljakutse` (p023)
- `juhi-` + `ametit` → `juhiametit` (p025)

Intra-line U+002D hyphens preserved (10 unique compounds):

- `AA-d`, `AA-ga`, `AA-lasega`, `AA-rühmas`, `AA-s` (AA abbreviation
  case-inflections)
- `Uus-Inglismaad`, `Uus-Inglismaale` (New England proper noun)
- `aeg-ajalt` (time expression), `nii-öelda` (so-called),
  `siin-seal` (here-there)

## Running-header drop audit

No running headers leaked into body blocks:

- `ANONÜÜMSED ALKOHOOLIKUD` (even pages 252, 254, 256, 258, 260, 262) —
  dropped at y=35 size=11.0.
- `NÕIARING` (odd pages 253, 255, 257, 259, 261, 263) — dropped at
  y=35 size=11.0. The title-page heading at y=66.6 size=14.0 correctly
  emits as the section heading.

Page numbers (219..231) all dropped: p251's book-page `219` sits at
bottom (y=530.79); subsequent pages' numbers sit at top (y=35) paired
with the running header.

## Source quirks preserved verbatim

Per the ET conventions "do-not-fix" policy:

- **`iskliku`** (p019) — should be `isikliku`. Source rendering.
- **`juhtoina`** (p021) — should be `juhti` (`we chose a new leader`
  in EN). Source typo.
- **`tekitasi`** (p013, source) — wait, this appears in body: `See
  tekitasi minus sellist tõrksust`. Should be `tekitas`. Preserved.
- **`Fitz—mehed`** (p006) — em-dash instead of en-dash. Preserved.
- **`1945 aasta juunis`** (p026) — missing period after `1945`
  (should be `1945. aasta`). Source has ` 1945 aasta juunis...` with a
  stray leading space, trimmed during paragraph normalization.

## Schema proposals

**Proposal: ET en-dash / minus-sign line-end join should detect
space-padding via the preceding character as well as the trailing
character.**

The Wave 1 rule checked whether the raw previous line ended with
`\u2013 ` or `\u2212 ` (dash followed by space). This misses the case
where the PDF source has `word – ` as the line-end, but the trailing
space is stripped during line-end truncation, leaving just `word –` at
the raw span level.

Fix: treat as space-padded when EITHER (a) the raw prev line had a
trailing space after the dash, OR (b) the character immediately
preceding the dash in the out-buffer is a space.

Implementation:

```python
elif out.endswith(("\u2013", "\u2212")):
    preceded_by_space = len(out) >= 2 and out[-2] == " "
    if prev_had_trailing_space or preceded_by_space:
        out += " " + nxt
    else:
        out += nxt
```

This converged the noiaring-p006 `kõrvale –see` → `kõrvale – see`
artifact. No other Wave 1-3 ET outputs likely need retro-fixes: the
rule only changes behavior in the narrow case where the dash is
at line-end with left-space-padding but no right-space.

No other conventions changes needed. Existing ET Wave 1–3 rules covered
this section cleanly — story-number-drop, italic-deck-as-1-paragraph,
drop-cap merge (with the two-glyph `8.` variant), soft-hyphen join,
and running-header gate all behaved as documented.
