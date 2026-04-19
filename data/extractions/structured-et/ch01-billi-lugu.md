# ch01-billi-lugu — extraction report

**Section:** Billi lugu (Bill's Story, Estonian edition)
**PDF pages:** 33-48 (book pages 1-16)
**Output:** `data/extractions/structured-et/ch01-billi-lugu.json` — 71 blocks.

## Summary

Pilot extraction for Estonian Wave 1. The ET PDF (`legacy/_source/BIGBOOK layout.pdf`) follows nearly the same visual pattern as the English 4th-edition layout, with one major structural difference for text normalization: **Estonian end-of-line word-break is encoded as U+00AD SOFT HYPHEN**, not as a real hyphen-minus followed by a newline. 104 source lines end in `\u00ad`; all are joined tightly in the output.

Block counts:

| kind      | count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 67    |
| verse     | 1     |
| footnote  | 1     |
| byline    | 1     |
| **total** | **71** |

## Method

- `pymupdf.open(PDF)` + `page.get_text("dict")` for the 16 chapter pages.
- Lines sorted by `(pdf_page, y0, x0)` for reading order.
- Drop rules:
  - Running headers at `y0 < 50` with `size <= 11.5` OR digit-only text. (ET running headers are set at `size = 11.0`, one point larger than EN's 9.0, so the gate had to be loosened from the EN parent-convention's `size <= 9.5`.)
  - Bottom-of-page page number on page 33 (`'1'` at y≈530, size 11).
  - Italic chapter label `1. peatükk` on page 33 (size 12.5, NewCaledoniaLTStd-It).
- Heading detection: `BILLI LUGU` at NewCaledoniaLTStd 14pt on page 33.
- Drop-cap detection: `S` in `BrushScriptStd` at ~33pt on page 33, x=56.7, y=101.
- Verse detection: lines at x in [95, 170] on page 33, y in [310, 420], grouped into y-bands (tolerance 2pt) so the tab-indented wrap fragment `\t` + `'või kannust.”'` merges with its sibling line.
- Footnote detection: line on page 48 with `y > 500`, `size <= 10.5`, `text.startswith('*')`.
- Byline detection: lines on page 48 with `y > 500`, italic NewCaledoniaLTStd, `size <= 10.5`, NOT starting with `*`.

## Schema decisions

- **Heading text**: preserved as `BILLI LUGU` (ALL-CAPS visual rendering). Section metadata `title` stays `"Billi lugu"` (prose-case) per the parent conventions' `title` vs. heading-block-text divergence.
- **Chapter label dropped**: `1. peatükk` (Estonian for "Chapter 1") dropped per the EN convention for `Chapter N` labels.
- **Drop-cap merge**: `S` (BrushScriptStd ~33pt) merged with the first body line `'õjapalavik hõõgus Uus-Inglismaa linnas, kuhu '` → `"Sõjapalavik hõõgus Uus-Inglismaa linnas, kuhu ..."`. No space between `S` and `õ`; the Estonian word is `Sõjapalavik` (= "war fever"). Small-caps tail flattening NOT needed here — the body text after the drop-cap is set in regular NewCaledoniaLTStd, not small caps.
- **Verse**: 6 poetic lines. The last physical source line rendered as a tab-indented wrap (`\t` at x=102 + `või kannust.”` at x=128.7, both at y=395.3). Grouped by y-band (tolerance 2pt) — but the `\t` fragment is at y=395.3 and `kas langes musketist ta` is at y=380.8, so those are separate bands. The tab-wrap fragment at y=395.3 groups with `või kannust.”` producing the final poetic line.
- **Footnote**: preserved `*` as the first character per the EN convention. Source text has a PDF OCR-ish artifact `o1i` (should be Estonian `oli` = "was"); preserved faithfully — not silently corrected.
- **Byline**: two italic lines on page 48 joined with `", "` per the EN convention (Wave 4 multi-line byline rule). Output: `"Bill W, AA üks asutajaliikmeid, suri 24. jaan. 1971."`. Note the source says `Bill W,` (no period after `W`) — preserved faithfully (diverges from EN's `Bill W.,`).
- **Footnote reference in body**: the body text on page 48 (`'kasvame nii arvukuselt kui jõult.*'`) ends with a superscript `*`. Preserved inline in `p066` text — the `*` cross-references the footnote block.

## Flagged blocks

None. The extraction converged on first attempt after two iterations (drop-cap wrap-zone adjustment + soft-hyphen trailing-space preservation).

## Verdicts

- **Heading**: `BILLI LUGU` — visual rendering preserved.
- **Drop-cap**: `S` (BrushScriptStd 33pt), merged with `õjapalavik hõõgus...` → `Sõjapalavik hõõgus...`. Note this is SMALLER than the EN chapter drop-cap (ParkAvenue 51.6pt) — only 33pt. The ET book uses a slightly smaller decorative script face.
- **Diacritics**: `õ ä ö ü` and capitals `Õ Ä Ö Ü` all pass through PyMuPDF cleanly. Verified in block text: `Sõjapalavik`, `pöördusin`, `väga`, `ülevad`, `hõõgus`, `õigusteadust`, `füüsiliseks`, `õnn` etc. No ligature-like encoding issues.
- **Verse**: YES, the Hampshire Grenadier tombstone IS present in Estonian — as a `verse` block with 6 lines and internal `\n` separators. Quoted with ET-style curly quotes `„...”`. English `’er` becomes ET `'i` (Hampshire'i — using Estonian genitive apostrophe convention, rendered as U+2019).
- **Dialogue**: handled correctly within `paragraph` blocks (4 blocks contain embedded dialogue with `„...”` Estonian quotes). No borderline cases — no dialogue forced into verse/blockquote.
- **Footnote**: single footnote present (page 48), `*`-marked. The body `*` reference also preserved inline (page 48 body text `...jõult.*`).
- **Byline**: 2-line italic sign-off at the end of page 48, emitted as one `byline` block joined with `", "`.

## Cross-line hyphenation

**Seed ET-allowlist expectation: NONE** — proven correct. In this chapter:

- **104 soft-hyphen line-ends** (U+00AD) — all joined without space. No allowlist is needed because the source PDF uses soft hyphen as the typographic word-break marker, meaning the PDF itself tells us "this is a word-join, not a compound hyphen".
- **Zero real hyphen (U+002D) line-ends** — so the ET default "strip and join" rule has no effective impact on this pilot. The EN-style compound-preservation allowlist (`self-`, `well-`, etc.) is irrelevant for Estonian because the typographic convention is different.
- **Zero mangled words** — verified by parallel-source audit in `.tmp/audit-softhyp.py`: every source soft-hyphen line-end in pages 33-48 produces a correctly-joined word in the output.

Consequence: **no ET allowlist entries needed for Wave 1**. The convention is "U+00AD at line-end → strip and join tight; no allowlist". Real compound hyphens inside an Estonian word (e.g. `Uus-Inglismaa`, `Järk-järgult`, `Kolm-neli`) sit mid-line with a real `-` character between two non-hyphenated fragments; they are NOT involved in cross-line hyphenation at all. The ET default rule (strip real `-` at line-end if next line starts lowercase) was NEVER EXERCISED in this section because there are zero such line-ends.

## Proposed additions to the ET conventions doc

These are the most valuable output of the pilot. Text ready to be appended to `2026-04-18-structured-extraction-et-conventions.md` — all findings below are ET-specific (parent doc's English rules do not cover them).

### 1. Soft hyphen (U+00AD) is the Estonian cross-line word-break marker

```
**Cross-line word-break: U+00AD SOFT HYPHEN is the ET hyphenation marker.**

The Estonian PDF uses U+00AD (not a plain U+002D HYPHEN-MINUS) to mark the
end-of-line break inside a word that has been hyphenated for text-wrap.
Across 16 pages of Billi lugu (pdf 33-48), 104 lines end with U+00AD and
ZERO lines end with U+002D. The parent English conventions call for
stripping U+00AD globally during normalization, but in ET the position of
the soft hyphen is load-bearing: it is the signal to join the next line
WITHOUT inserting a space.

**Rule:** when a line ends with U+00AD, strip the soft hyphen and join the
next line without a space. Only after the per-line join should any
remaining U+00AD characters (mid-line artifacts, if any) be stripped
globally.

**Implementation note:** strip U+00AD only at the end of join_paragraph_lines,
not during the initial line-text normalization. If stripped early, the
line-join logic will see "saabu" + "nud" and insert a space, producing
"saabu nud" instead of "saabunud".
```

### 2. Running headers are 11pt, not 9pt

```
**Running headers in the Estonian typesetting are set at 11pt** — one
point larger than the English 9pt. The parent convention's
`size <= 9.5 AND y0 < 50` drop rule misses them. ET agents must use
`size <= 11.5 AND y0 < 50` (or add an explicit text-match for known
running-header strings).

Known running headers in ET:
- `ANONÜÜMSED ALKOHOOLIKUD` (even pages, all chapters and appendices)
- Chapter/section title in ALL CAPS (odd pages, e.g. `BILLI LUGU`)

Same 11pt size applies to page numbers in the top corners.
```

### 3. Mid-sentence dashes: en-dash U+2013 and minus-sign U+2212

```
**En-dash (U+2013) and minus-sign (U+2212) are the Estonian mid-sentence
dash characters**, not em-dash (U+2014). Billi lugu contains 10 en-dashes
and 4 minus-signs; zero em-dashes.

Typographic convention: the dash appears space-padded (`word − word`).
When the line breaks at that point — source line ends `word − ` (trailing
space before the newline) — join the next line WITH a space, preserving
the mid-sentence dash usage. Do NOT apply the parent EN em-dash rule
(which collapses spaces across em-dash).

**Rule:** at a line-end with U+2013 or U+2212:
- if the raw line had trailing whitespace before rstrip → join WITH space
- otherwise → join tight (tight-compound dash; did not occur in Billi lugu,
  but the rule is safe for future sections)

At a line-start with U+2013 or U+2212 → always join with a space
(mid-sentence dash).
```

### 4. Drop-cap font and size differ from English

```
**ET chapter drop-caps are BrushScriptStd at ~33pt** (not ParkAvenue 51pt
as in EN). Same merge rule applies: concatenate the drop-cap glyph with
the first word of the first paragraph (no space). Small-caps tail
flattening is NOT needed in Billi lugu — the body text after the drop-cap
is already in regular body case, not small caps. Verify per section.

Detection:
- `font == "BrushScriptStd"` (or contains "BrushScript")
- `size > 20` (smaller gate than EN's `> 40`)
```

### 5. Chapter label translation

```
**ET chapter label** is `N. peatükk` (e.g. `1. peatükk` = "Chapter 1"),
set in NewCaledoniaLTStd-Italic at ~12.5pt. Drop per parent convention
(same rule as EN `Chapter N` label).

Regex-friendly pattern: `^\d+\.\s*peatükk$` (case-insensitive).
```

### 6. Allowlist decision for cross-line real hyphens

```
**Per-line real hyphens (U+002D) at line-ends are NOT used in this book
for cross-line word-breaks** — the book uses U+00AD (soft hyphen) for
that role. Consequently, an allowlist-vs-strip decision for real hyphens
is moot for Wave 1.

**Seed rule for Wave 2+**: if a later section does use U+002D at line-end
(unlikely but possible), default to STRIP-AND-JOIN (no allowlist).
Flag any mangled words for PO review.
```

## Artifact notes (non-rule-forming)

- **`o1i` OCR artifact** in the footnote (`"*2001. aastal o1i AA-l üle 100 000 rühma."`). Should read `oli` (was). Preserved verbatim from PDF.
- **`sõruskonna` typo** on page 48 body text (should be `sõpruskonna`). Preserved verbatim.
- **`Bill W,`** (no period) in the byline. EN equivalent has `Bill W.,`. Preserved verbatim.

These are source-faithful artifacts, not extraction bugs.
