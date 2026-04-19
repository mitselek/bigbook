# ch03-alkoholismist-lahemalt

## Summary

Estonian chapter 3 "Alkoholismist lähemalt" (More About Alcoholism). PDF pages
62..75, book pages 30..43. Emitted **43 blocks**: 1 heading + 41 paragraphs + 1
footnote. **Exact block-count parity with EN ch03** (`ch03-more-about-alcoholism`,
also 1 + 41 + 1 = 43). Zero verse. No list items, no blockquotes, no bylines,
no tables.

## Method

- Python: `pymupdf` (`page.get_text("dict")`) via repo venv.
- Dispatch to `.tmp/extract-ch03-et.py` (single script, no source changes).
- Applied ET + EN conventions as-is; no new heuristics needed.

Heuristics fired:

- **ET running-header drop** `y0 < 45 AND (size <= 11.5 OR isdigit)`. Drops the
  `ALKOHOLISMIST LÄHEMALT` odd-page top-header at y=35 size 11 and the
  `ANONÜÜMSED ALKOHOOLIKUD` even-page top-header at y=35 size 11, plus the
  page-number digits at y=35 size 11.
- **Bottom-of-page page number drop** on page 62 (y=530.8, size 11, text `"30"`).
- **Chapter-label drop** `^\d+\.\s*peatükk\s*$` hits `3. peatükk` at page 62 y=52
  size 12.5 italic.
- **Heading detect**: `ALKOHOLISMIST LÄHEMALT` at page 62 y=77 size 14.
- **Drop-cap merge**: `E` BrushScriptStd 33pt at page 62 x=54.7 y=102.7 merged
  into the first wrap-line `namik meie hulgast...` (x=80.7 y=107.3) → yields
  `Enamik meie hulgast...`.
- **Drop-cap wrap-zone** on page 62 up to y ≤ 135 and x ≥ 75: keeps the second
  wrap line `et olime tõelised alkohoolikud.` (y=121.8 x=80.7) inside the same
  paragraph instead of treating its high x as a new paragraph.
- **Soft-hyphen (U+00AD) cross-line join**: strip + no-space at join time
  (104+ instances across body; never pre-normalized out).
- **U+2212 MINUS SIGN mid-sentence dash** (e.g. p64 `"omase veendumuse ohvriks −
  et see pikk..."`) kept with surrounding spaces.
- **U+2013 EN-DASH mid-sentence** (e.g. p62 `"niisugustele perioodidele –
  harilikult lühikestele – järgnes..."`) kept with surrounding spaces.
- **Footnote detect** on page 66: 3 lines at y ∈ {531.3, 543.6, 554.6}, font
  Times-ItalicMT or NewCaledoniaLTStd-It, size 10. Gathered into one block with
  leading `*` marker preserved. Appended after body paragraphs.

## Schema decisions

- **Drop-cap**: standard ET treatment — merge with first body wrap line into the
  same paragraph (`p002`). No small-caps tail in ET (per ET conventions).
- **Dialogue / italic monologues kept as paragraph blocks**, not verse or
  blockquote. Two extended first-person accounts appear:
  - **Jim's whiskey-in-milk passage** (p68, y=353..411 italic). Rendered as
    three body paragraphs (`p020` narration + opening quote, `p021` italic
    sub-paragraph `„Korraga käis...võtsin veel ühe."`, `p022` narrator resume
    `Niimoodi algas...`). Same split as EN ch03 `p020`/`p021`/`p022` — the
    italic sub-paragraph's own first-line indent makes it a typographically
    distinct paragraph even though the speaker is the same. Kept each in
    `paragraph`.
  - **Fred's Washington passage** (p72-p74). Multiple body paragraphs; italic
    lines on p73 y=150..179 and p73 y=382..411 are interior emphasis within
    their surrounding paragraphs (no new indent), so they are absorbed into
    `p035` / `p036` respectively. Matches EN ch03 behavior.
- **Verse verdict: zero.** No verse candidates — no center-indented, short,
  blank-surrounded passages anywhere in the section.
- **Footnote placement**: appended after all body paragraphs (end of `blocks[]`)
  per ch02 precedent, not inline at its page.
- **Block IDs**: continuous ordinal 001..043 across all kinds (single `h`, 41
  consecutive `p`, tail `f`). No per-kind restart.

## Flagged blocks

None are materially uncertain. Two minor notes for the record:

- **p010** (p64) contains the U+2212 MINUS SIGN mid-sentence dash
  `"omase veendumuse ohvriks − et see pikk..."`. Preserved verbatim (ET
  convention). Not an em-dash.
- **p040** (p75) contains `"vaeseomaks klobitud"` (idiomatic ET "beaten to a
  pulp" / "made into an orphan's lot"). Source PDF renders this as a single
  word split by soft hyphen (`vaese\u00ADomaks`). Join rule yields `vaeseomaks`;
  preserved verbatim per fidelity-over-correction principle.
- **p011** (p65) preserves the embedded quotation with ET curly quotes:
  `„Kes kord alkohoolik on, see ka alkohoolikuks jääb"`. Both `„` (U+201E) and
  `"` (U+201D) preserved as authored.

## Schema proposals

None. Both EN and ET conventions covered every case in this section. The ch02
precedent script ported cleanly to ch03 with only section-specific parameter
changes (page range, heading text, drop-cap letter + coordinates). Block-count
parity with EN (43/43) is another strong validation of the shared schema.
