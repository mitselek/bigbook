# story-building-a-new-life — extraction report

## Summary

Extracted pages 482-491 (Part III / They Lost Nearly All, story #6, "Building a New Life").

**Blocks emitted: 38** — 1 heading + 37 paragraphs. No list-items, verses, footnotes, tables, or bylines. No high-level issues.

## Method

- `pymupdf.open(PDF).get_text("dict")` per page; iterated blocks → lines → spans.
- Probe dump: `.tmp/building-a-new-life-probe.txt` (354 lines).
- Sorted lines by `(pdf_page, y0, x0)`.
- Dropped running top-of-page headers and running titles (size ≤ 9.5 AND y0 < 50).
- Dropped digits-only top-of-page numbers (y < 50, any size).
- Dropped bottom-of-page number on page 482 (`476` at y=540, size=9).
- Dropped decorative story-number `(6)` on page 482 (y=79, size=12.5).
- Paragraph split on first-line indent past body margin (≥ body_margin + 8).
- Even pages (482, 484, 486, 488, 490) body margin 69.28, indent 81.28.
- Odd pages (483, 485, 487, 489, 491) body margin 52.28, indent 64.28.
- Cross-page paragraph merge via right-margin carry-over (threshold 280pt) when the first line on the new page is NOT at paragraph-indent.
- Drop-cap wrap-zone: y-range of 45pt from the `W` drop-cap at x > body_margin + 15 does not start a new paragraph.

## Schema decisions

- **Story-number `(6)`**: dropped (per conventions, "Lean toward DROP — structural numbering, not authored content").
- **Subtitle**: 5 italic lines, single indent group (first line x=93.28, continuations x=81.27). Emitted as one `paragraph` block per the default rule.
- **Drop-cap**: single-letter `W` (ParkAvenue, 51.65pt) at y=211 on page 482. First body line at y=224 begins in NewCaledonia-SC with text `e had been in the ﬁelds all day baling hay.`. Merged: `W` + `e had been...` → `We had been...` (no space). Small-caps tail already flattened by PyMuPDF. No `\bi\b` pronoun fix needed here (opening doesn't contain lone `i`, but the substitution was still applied defensively).
- **No byline**: the story ends with the final paragraph "...On my own I could not have quit. I know, I tried it." — no author attribution follows in the probe dump. Emitted nothing.
- **Compound-hyphen allowlist extension**: added `all-` as a **section-specific** prefix because the source's `all-night store` split cross-line (p487). Without the extension the join would have produced `allnight`. This matches the Wave 7 pattern used by `story-acceptance-was-the-answer` for `mind-`. Not proposing for global allowlist — `all-` has common non-compound uses (`all- though` would be a false positive for a theoretical split); section-local seems right.

## Hyphen-join outcomes

All 21 cross-line hyphenated splits resolve correctly:

- Stripped (not in allowlist): `received`, `foundation`, `divorced`, `sisters`, `myself` (x2), `buddies`, `mentioned`, `apprentice`, `whatever`, `blaming`, `myself`, `construction` (x2), `intoxicated`, `however`, `weaving`, `company`, `department`, `service`, `comfortable`, `drinking`.
- Preserved (section-specific `all-` allowlist entry): `all-night`.

Inline compound hyphens preserved (never crossed a line break): `once-happy`, `horse-drawn`, `hit-and-run`, `full-blown`, `hung-over`, `six-pack`, `mid-January`, `father-in-law`, `Spanish-speaking`.

## Flagged blocks

None of the 38 blocks are uncertain. All paragraph boundaries match the clear first-line indent signal in the probe dump. No verse, list, table, or blockquote candidates.

Minor nit: block `p002` joins the 5-line italic deck into one paragraph with embedded em-dash `God—a ﬁrm foundation`. The em-dash falls mid-line (not at a line break), so the join is a simple " " concatenation that was later followed by the cross-line `founda-/tion` strip — final text: `a firm foundation in sobriety that would hold up through good times and bad.` Clean.

## Schema proposals

None. This extraction hits no new patterns; the Wave 5-7 rule set covers everything except the one `all-` compound addressed section-locally. If `all-` recurs as a cross-line split in future waves (unlikely; English `all-` compounds are rare), consider a global allowlist addition — but one instance is not enough evidence.

## Validation

- `json.load` succeeds; top-level keys match schema.
- 38 blocks, continuous ids `h001`, `p002`..`p038`.
- `pdfPage` values span 482..491 (all 10 pages covered).
