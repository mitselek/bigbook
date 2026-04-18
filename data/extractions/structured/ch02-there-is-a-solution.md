# ch02 — There is a Solution — extraction report

## Summary

Extracted **ch02-there-is-a-solution** (PDF pages 38..50) via PyMuPDF. Output contains **55 blocks**: 1 heading, 52 paragraphs, 2 footnotes. **Zero verse**, zero blockquote, zero list-item, zero table, zero byline — as expected for this prose chapter.

All two structural stress-tests called out in the prompt resolved cleanly:

1. **Quoted doctor-testimony passages stay inside `paragraph` blocks.** The extended Jung-derived dialogue on pp47-48 (three direct-speech turns plus the doctor's long italic-free monologue) is emitted as four consecutive `paragraph` blocks (`p041`-`p045`). No `"`-opens triggered a verse or blockquote split.
2. **Italicized passages stay inline with their paragraph.** The three italic-prominent passages (`p008` on p39, `p030` on p45, and the italic first sentence of `p034` on p46 "There is a solution.") are kept in single paragraph blocks; italics alone did not cause a split.

## Method

- PyMuPDF `page.get_text("dict")` for per-line spans, fonts, sizes, and bbox.
- Probe script: `.tmp/probe-ch02.py` dumped every content line with y0/x0/size/font metadata.
- Extractor: `.tmp/extract-ch02.py` (same skeleton as ch08's extractor).

Heuristics fired:

- Body font = NewCaledonia 12.0 on every page.
- Running-head strip: `y0 < 50` (drops `THERE IS A SOLUTION` / `ALCOHOLICS ANONYMOUS` 9pt tops and top page numbers).
- Bottom page-number strip: numeric-only lines with `y0 > 525`.
- `Chapter 2` italic 12.5 label on p38 — dropped per conventions.
- Heading detection: size ≥ 13 on p38.
- Drop-cap 'W' (ParkAvenue ~51.7pt) on p38 — merged into `We` of the first body line (no space; the body line's leading text is `e, of ALCOHOLICS ANONYMOUS...`).
- Paragraph-start detector: `body_margin + 8 <= x0 <= body_margin + 20`. Matches all 52 paragraph starts on both odd (~70.9 margin) and even (~53.9 margin) pages.
- Drop-cap wrap-zone on p38: the second line of the first paragraph (y<170) stays attached to the current paragraph rather than being treated as a new para-start.
- Footnote detection: `Times-Roman` 8pt lines starting with `*`. Two footnotes on p46 (`*Fully explained—Appendix II.`) and p48 (`*For amplification—see Appendix II.`). Both emitted at end of section (same precedent as ch08's two-footnote handling). Leading `*` preserved per conventions.

## Schema decisions

- **Heading text** is the visual rendering `THERE IS A SOLUTION` (matches conventions: `title` metadata stays prose-case `There is a Solution`; the heading block carries the on-page form).
- **Drop-cap merge**: `W` + `e, of ALCOHOLICS ANONYMOUS, know ...` → `We, of ALCOHOLICS ANONYMOUS, know ...` (no space). The `NewCaledonia-SC` small-caps on the first line flattens naturally because the span text is already encoded as regular lowercase (`e, of ALCOHOLICS ANONYMOUS`), so no case transform was needed beyond the merge.
- **Asterisk cross-reference markers** in body prose (`...spiritual experiences*` on p46 in `p035`, `...your description."*` on p48 in `p044`) are preserved in the paragraph text as-is, matching the ch01 precedent (`growing in numbers and power.*`). The matching footnote blocks carry a leading `*` so the cross-reference is preserved at both ends.
- **Footnote placement**: both footnotes emitted at the tail of the block list (`f054`, `f055`) rather than inline at their visual page positions. Same convention as ch08.
- **`so-called` in `p030`** was joined as `socalled`. This is per the narrow compound allowlist (Wave 2): `so` is not on the allowlist, so the cross-line hyphen was stripped. The hyphen in the source is a line-break artifact (the word happens to be hyphenated in English, but the PDF's mid-word split was at a coincidental position); the allowlist-based heuristic cannot distinguish these. See "Flagged blocks" below.

## Flagged blocks

### `ex-` allowlist false positives (two occurrences)

- **`ch02-there-is-a-solution-p023`** (p43): `"If hundreds of ex-periences have shown him..."`. Source line-break: `Why does he behave like this? If hundreds of ex-` + `periences have shown him...`. The word is `experiences`, not an `ex-`-compound. The `ex-` entry on the narrow compound allowlist matched the letter pattern and preserved the hyphen.

- **`ch02-there-is-a-solution-p037`** (p47): `"...he could give himself no satisfactory ex-planation for his fall."`. Source line-break: `...no satisfactory ex-` + `planation for his fall.`. The word is `explanation`, not an `ex-`-compound.

Both are the same failure mode that Wave 2 flagged for `re-`/`pre-`/`sub-`/`super-` (common prefixes that overwhelmingly produce non-compound mid-word splits). The genuine `ex-`-compound `ex-problem` (as in `ex-problem drinker`) appears three times in ch02 and is rendered correctly — but only because those occurrences are not split across lines in the source typography. If the book typeset `ex-problem` across a line break it would be handled correctly by the allowlist. The question for Plantin is whether `ex-` belongs on the narrow allowlist at all: based on ch02 evidence, the false-positive rate is 2:0 against (two `experience`/`explanation` splits vs zero `ex-compound` cross-line splits).

### `socalled` vs `so-called`

- **`ch02-there-is-a-solution-p030`** (p45): `"...Our socalled will power becomes practically nonexistent."`. Source: `so-` + `called`. English has `so-called` as a hyphenated compound; the narrow allowlist does not include `so-`, so the hyphen is stripped. Flagged for discussion — would need to either add `so-` to the allowlist (scoped narrowly — unlikely to false-positive since `so-` is rarely a line-final prefix on non-compound words) or accept the current behavior.

### Italic-first-sentence paragraph

- **`ch02-there-is-a-solution-p034`** (p46): `"There is a solution. Almost none of us liked the self-searching..."`. The phrase `There is a solution.` is italicized (NewCaledonia-Italic), then the paragraph continues in roman. Rendered as a single paragraph per conventions (italics alone is not a split signal). Verse-risk signal was near-zero here (no quotation marks, normal prose continuation).

### All-italic paragraphs

- **`ch02-there-is-a-solution-p008`** (p39): full paragraph in NewCaledonia-Italic (`But the ex-problem drinker who has found this solution...`). Rendered as a normal paragraph. This is the `ex-problem` hyphen that appears cleanly; italic is emphasis only.
- **`ch02-there-is-a-solution-p030`** (p45): full paragraph in NewCaledonia-Italic (`The fact is that most alcoholics, for reasons yet obscure...`). Normal paragraph. Contains the `socalled` hyphenation case.

### Doctor's dialogue passages (the structural stress-test)

- **`ch02-there-is-a-solution-p042`** (p48): `"The doctor said: "You have the mind of a chronic alcoholic. I have never seen one single case recover, where that state of mind existed to the extent that it does in you." Our friend felt as though the gates of hell had closed on him with a clang."`. Single paragraph with embedded direct speech. No verse false-positive.
- **`ch02-there-is-a-solution-p043`** (p48): `"He said to the doctor, "Is there no exception?""`. A short 1-line paragraph whose content is essentially a dialogue turn. Still a paragraph, not a verse/blockquote.
- **`ch02-there-is-a-solution-p044`** (p48): the long doctor's reply (`"Yes," replied the doctor, "there is. Exceptions to cases such as yours have been occurring since early times..."`). ~140-word paragraph spanning y=212..416 on p48. Single paragraph block. Contains the inline `*` cross-reference to footnote `f055`.

These are exactly the quoted-testimony passages the prompt warned about. No verse signal (line-length, center-indent, or shared-x) appeared.

## Schema proposals

### Proposal 1: drop `ex-` from the compound allowlist

Evidence from ch02: two `ex-`-triggered false positives (`ex-periences`, `ex-planation`) vs zero legitimate `ex-`-compound cross-line splits. Mirrors the `re-`/`pre-`/`sub-`/`super-` failure mode accepted in Wave 2. The remaining allowlist would be `self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-` (seven prefixes). Genuine `ex-`-compounds like `ex-problem` and `ex-wife` would join without a hyphen in the rare case they're split across lines, which is wrong, but the alternative (current behavior) is wrong twice in ch02 alone.

A safer refinement would be a per-word allowlist rather than a prefix allowlist — but that expands scope beyond this chapter's evidence. Starting recommendation: **drop `ex-` and accept the rare `ex-compound` line-split as an acceptable cost**, matching Wave 2's treatment of `re-`.

### Proposal 2: handle `so-called` specifically

`so-called` is one of a small set of English compounds where both halves look like ordinary words. Adding `so-` to the prefix allowlist would catch it, but `so` is a common word-start (`some`, `society`, `solution`, `source`), so `so-` would over-match. A cleaner approach is a tiny per-word preservation list: `{so-called, ex-wife, ex-problem, ...}`. Not urgent; flagged for future consideration if more such cases appear.

## Verse verdict

**Zero verse blocks emitted.** The prompt's key risk — the doctor's testimony in quoted direct speech being false-fired as verse — did not occur because the extractor never attempts verse detection in ch02 (no section-specific verse heuristic was added, and the general paragraph walker treats every body line at the paragraph-start indent as starting a paragraph regardless of leading character). Signals that could have been mis-interpreted:

- `"` at the start of paragraphs `p042`, `p043`, `p044`: ignored — first-character quote marks are not a verse or blockquote signal per conventions.
- Short one-line paragraph `p043` (`He said to the doctor, "Is there no exception?"`): short line, but sits at normal body-margin indent (x0=65.9, +12 past body margin) and has no other verse-like signals (no shared-x column grouping, no ellipsis rhythm, no surrounding blank lines in the source). Kept as paragraph.

## Drop-cap verdict

**Clean merge.** Drop-cap `W` (ParkAvenue 51.7pt at x0=53.3 y0=127.3 on p38) was merged into the first body line's text `e, of ALCOHOLICS ANONYMOUS, know` producing `We, of ALCOHOLICS ANONYMOUS, know` with no intervening space. The second line of the first paragraph (the wrap line at y≈155 sitting at the body margin x≈53.9, not at the paragraph-start indent) was kept attached to the first paragraph rather than being treated as a new para-start, via the drop-cap-wrap exception on p38.

## Artifact files

- `/home/michelek/Documents/github/bigbook/data/extractions/structured/ch02-there-is-a-solution.json`
- `/home/michelek/Documents/github/bigbook/data/extractions/structured/ch02-there-is-a-solution.md`
- `.tmp/extract-ch02.py` — extractor script (disposable)
- `.tmp/probe-ch02.py`, `.tmp/ch02-probe.txt` — debug probe
