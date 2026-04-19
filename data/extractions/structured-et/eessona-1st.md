# eessona-1st — extraction report

## Summary

Two-page ET front-matter section (PDF pages 13-14, `Eessõna esimesele väljaandele`). Emitted **10 blocks**: 1 heading + 1 italic-deck paragraph + 7 body paragraphs + 1 byline. Zero list-items, verse, table, blockquote, footnote. No source-code modifications. JSON validated with `json.load()`.

Estonian counterpart to EN `foreword-1st-edition`. Unlike the EN version — which is a facsimile of the 1939 first printing reproduced at ~9pt on a single page — the ET edition is typeset at **normal front-matter scale** (heading 14pt, italic subtitle 12.5pt, body 12.5pt, drop-cap BrushScriptStd 33pt). The EN facsimile workaround (text-match heading detection, heading-size-override) does NOT apply to ET. Standard ET conventions fit cleanly.

## Method

- **PyMuPDF** only, `page.get_text("dict")`. No `pdfplumber`.
- Probe: `.tmp/probe-eessona-1st.py`. Extraction: `.tmp/extract-eessona-1st.py`.
- PDF pages indexed 12-13 (1-based 13-14).

### Heuristics fired

- **Heading detection by size** (≥13.0pt per Wave 4 rule relaxation). Heading at y=49.2, size=14.0. Despite `y0 < 50` this is NOT a running header because size > 11.5.
- **ET running-header drop rule** (`y0 < 45 AND (size ≤ 11.5 OR text matches page-number regex)`) fired on page 14 top (`EESSÕNA ESIMESELE VÄLJAANDELE` at y=35, size=11.0) and `xiv` page number at y=35, size=11.0.
- **Bottom-of-page roman-numeral page number** (`xiii` at y=530, size=11.0 on page 13) dropped via footer rule (`y > page_h - 80`).
- **Drop-cap merge**: `M` (BrushScriptStd, size=33.0) sits at y=112 on page 13 alongside the first body line `'eie, Anonüümsete Alkohoolikute liikmed, '` (which wraps around the drop-cap at x≈100 vs body margin 56.7). PyMuPDF emits the drop-cap as a separate block late in reading order — I gather it separately and prepend to the first body paragraph's first word: `M` + `eie,` = `Meie,`. No space inserted (per ET/EN drop-cap rule).
- **Italic subtitle** (`NewCaledoniaLTStd-It` at size 12.5, y ∈ [77, 91]) emitted as a single `paragraph` block per conventions default: `"Ära toodud sellisel kujul, nagu see ilmus esimese väljaande esimeses trükis 1939. aastal."` (two source lines joined).
- **Soft-hyphen cross-line join** fired on multiple lines (ET convention — strip U+00AD, join without space). Examples: `ter\u00AD` + `venenud` → `tervenenud`; `eesmär\u00AD` + `giks` → `eesmärgiks`; `abipal\u00AD` + `vetega` → `abipalvetega`; `tähendu\u00AD` + `ses` → `tähenduses`; `lõpe\u00AD` (page 13 last body line) + `tada` (page 14 first line) → `lõpetada` (soft-hyphen works cleanly across page boundary).
- **Cross-page paragraph merge**: page 13 ends mid-paragraph-7 (`...joomine lõpe-`), page 14 continues at body margin (`tada. Me ei ole seotud...`). Because page 14's continuation line starts at body margin (x=56.7, not at indent 68), the paragraph-start detector correctly keeps it in the same paragraph. No terminal-punctuation heuristic needed.
- **Paragraph boundary detection**: first-line indent threshold `x0 ≥ 63` (normal indent ~68; drop-cap wrap ~100), preceding line near body margin (`x0 ≤ 60`). Body margin ~56.7; paragraph starts ~68. Worked for all 7 body paragraphs.
- **Byline detection**: `Anonüümsed Alkohoolikud` at page 14, y=179, x0=167 (right-shifted), width < 60 chars. Distinct typographic signature from body (right-aligned, short, no indent lead-in). Emitted as `byline` block. Matches the "author attribution at end of signed front-matter text" pattern (cf. Silkworth letters in arsti-arvamus).

## Schema decisions

1. **Drop-cap verdict: present, ET-style.** The drop-cap here is `M` in **BrushScriptStd at 33pt** (per ET Wave 1 convention — distinct from EN's ParkAvenue 51pt). No small-caps tail — body resumes at 12.5pt NewCaledonia directly. Merged as `M` + `eie,` = `Meie,`. This is the *first* ET foreword section to exhibit the drop-cap (the main `eessona` fourth-edition foreword uses a different opening `See on raamatu ...` with no drop-cap).

2. **Italic subtitle → single paragraph block.** Conventions default (italic deck, one sentence, two source lines). Matches EN foreword-1st-edition precedent.

3. **Byline emission (deviation from EN).** The EN foreword-1st-edition output has 9 blocks (no byline) because the EN facsimile page ends at `"Inquiry by scientific, medical, and religious societies will be welcomed."`. The ET source includes an additional right-aligned `Anonüümsed Alkohoolikud` sign-off line on page 14 (y=179, x=167). This is **authored content in the ET edition**, not a layout artifact. Emitted per conventions (`byline` kind, prefix `b`).

4. **Heading text preserves visual rendering.** Source renders `EESSÕNA ESIMESELE VÄLJAANDELE` (all-caps). `title` metadata is prose-case `Eessõna esimesele väljaandele`.

5. **No facsimile workaround applied.** Unlike EN, ET typesets this foreword at full body scale. Standard heading-by-size (≥13) and ET running-header rules (y<45 AND size≤11.5) work without override.

## Flagged blocks

None uncertain. All 10 blocks confident:

- `h001` heading: `EESSÕNA ESIMESELE VÄLJAANDELE`
- `p002` italic subtitle: `Ära toodud sellisel kujul, nagu see ilmus esimese väljaande esimeses trükis 1939. aastal.`
- `p003` body 1 with drop-cap merge: `Meie, Anonüümsete Alkohoolikute liikmed, oleme enam kui sada meest ja naist...`
- `p004`-`p007` four body paragraphs on page 13.
- `p008`-`p009` two body paragraphs on page 14.
- `b010` byline: `Anonüümsed Alkohoolikud`

## Counts

- Blocks: **10** (EN: 9; delta `+1` for ET-only byline)
- Heading: 1
- Paragraphs: 8 (1 italic subtitle + 7 body)
- Byline: 1
- Pages: 2 (PDF 13-14)

## Schema proposals

None. All ET and EN conventions apply cleanly. The byline `Anonüümsed Alkohoolikud` is a normal `byline`-kind block (already in schema, already documented for front-matter signed letters).

### Observation for evolution log

**ET foreword-1st byline is an ET-only feature** (EN foreword-1st-edition ends with `Inquiry by scientific, medical, and religious societies will be welcomed.` with no sign-off). This is a source-content difference between editions, not a convention issue. Note it if future cross-language diff tooling tries to enforce byline parity.

**ET foreword-1st is NOT a facsimile** despite its EN counterpart being one. The Estonian edition opted to reset the type at normal scale rather than reproduce the 1939 printing visually. Standard size/indent heuristics suffice; no facsimile workaround needed. One more reason the EN facsimile rule is a section-specific exception, not a general pattern.
