# ch03-more-about-alcoholism — extraction report

## Summary

Chapter 3, "More About Alcoholism" (PDF pages 51..64, 14 pages). 43 blocks emitted: 1 heading, 41 paragraphs, 1 footnote. Zero verse (per conventions; dialogue-in-prose stays in `paragraph`). No schema deviations. Drop-cap `M` merged cleanly into "Most".

## Method

Single PyMuPDF pass via `page.get_text("dict")`. Line-level iteration with font/size/bbox inspected per line. Helper script at `.tmp/extract-ch03.py`. No `pdfplumber` needed — PyMuPDF's line-level output was sufficient.

### Heuristics fired

- **Heading detection** — `size >= 13.0` + text match `MORE ABOUT ALCOHOLISM` on p51. Heading line sat at `y0=99`, well clear of the `y0 < 50` running-header drop zone.
- **Running-header/footer drop** — `y0 < 50 AND size <= 12.5`. Caught both the small-caps page numbers (size 12, y~34) and the 9pt running titles (`MORE ABOUT ALCOHOLISM` on evens, `ALCOHOLICS ANONYMOUS` on odds). Size guard is essential: the chapter heading on p51 is size 13.5 and would be killed by a y-only rule. (Not strictly needed here because its y~99, but kept for symmetry with the conventions' front-matter warning.)
- **Bottom-of-page page-number drop** — isolated digit lines at `y0 > 525`. Page 51 has `'30'` at y=537.5 — the only one in this chapter the y<50 rule does not already handle (most page numbers sit at y~34 which is < 50).
- **"Chapter 3" label drop** — regex `^Chapter\s+\d+\s*$` + italic font on p51. Size 12.5 NewCaledonia-Italic at y=76.
- **Drop-cap merge** — ParkAvenue glyph at size 51.6 on p51, captured and consumed as a sentinel. First non-consumed body line on p51 at `y0 > 120` gets prepended with `"M"` (no space). That line was `"ost of us have been unwilling to admit we"` (NewCaledonia-SC), producing `"Most of us have been unwilling..."`. The next line (`"were real alcoholics..."`) and subsequent drop-cap wrap-zone lines (y<170 at the wrap indent x~120) all stay attached to the first paragraph.
- **Paragraph-start detection** — `body_margin + 8 <= x0 <= body_margin + 20`. Body margin inferred per page from min `x0` of size-12 NewCaledonia lines (71 on odd pages, 54 on even). Paragraph indent lands at x~83 odd / x~66 even. Verified against probe output: all 41 paragraph starts match the expected y-positions from the PDF's visual layout. The final paragraph on p64 ("Once more:") begins at x=70.6, which falls in the 62..74 indent range for an even page — correctly flagged as paragraph start.
- **Footnote detection** — small-font (`size <= 9.0`) lines starting with `"*"`. Page 55 has one asterisked line (`* True when this book was first published...`) followed by a wrap line (`vey showed about one-fifth...`) both at 8pt; the wrap line is joined into the same footnote block. First line font is `TimesLTMM`, second is `NewCaledonia` at 8pt — both caught by size alone. Running-header lines (y<50) are explicitly excluded to avoid swallowing the next page's header into the footnote. Footnote text preserved with leading `*` for cross-reference to `…but try and get them to see it!*` in paragraph p013.
- **Cross-line hyphenation** — standard post-Wave-3 allowlist applied (`self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`, `one-`..`ten-`). Known joins verified: `self-knowledge`, `self-confident`, `self-discipline`, `self-deception`, `one-fifth` (in the footnote), `far-fetched`, `jay-walking`, `fast-moving`, `well balanced`, `world-renowned`, `re-assembled`, `re-emphasize`. All spot-checked in the output and look correct.

## Schema decisions

- **Drop-cap `M`** — merged with body remainder `ost of us...` into `Most of us...`. No space. Matches the "W" + "ar" → "War" precedent for ch02. Small-caps tail on the follower line (NewCaledonia-SC) was not specially flattened — the spans already arrive as lowercase text from PyMuPDF, since the small-caps styling is font-based rather than capitalization-based. Verified the output renders correctly as plain case.
- **"Chapter 3" label** — dropped (not emitted).
- **Heading text** — `MORE ABOUT ALCOHOLISM` (visual rendering, per conventions). Section `title` metadata is `More About Alcoholism` (prose case).
- **Italic dialogue passages** — italic-styled lines within Jim's whiskey-in-milk anecdote (p57 y=307.9–398.3) and Fred's Washington dinner anecdote (p62 y=168.1–226.2) were not split out. They are intentionally part of the surrounding `paragraph` blocks p021 and p035 respectively. This follows the conventions' explicit "italicized pull-quotes within prose stay inline" and "dialogue in prose is NOT verse or blockquote" rules. Per the prompt: **zero verse expected, zero verse emitted.**
- **Jim's narrated story** (pp57 y=51..p58 y=65.9) naturally splits into three paragraphs at the first-line indents: p020 (the setup, ends at "…another glass of milk."), p021 (the whiskey-in-milk italic tipping point, starts with a curly-open-quote and ends with `'tried another.'"`), and p022 (the narrator's commentary resuming, starts "Thus started one more journey…"). No special handling needed — the indent heuristic correctly split them.
- **Fred's narrated story** (pp61..64) spans seven paragraphs (p033..p039), each marked by a leading `"` since Fred's dialogue breaks into its own paragraphs. Also handled by the standard indent heuristic.
- **Block-id scheme** — continuous ordinal across all kinds (`h001`, `p002..p042`, `f043`). Matches conventions.

## Flagged blocks

No uncertainties flagged. Every paragraph boundary was verified against the PDF probe output. The footnote is single and unambiguous.

One item worth explicitly naming for posterity:

- **p013** (`…but try and get them to see it!*`) preserves the asterisk that marks the in-text footnote reference. The `*` is part of the paragraph text because it appears as a trailing character on that body line in the PDF. The footnote block (f043) independently preserves a leading `*`. Cross-reference works by convention rather than by an explicit link.

## Schema proposals

None. The conventions covered every situation encountered here. Chapter 3 is entirely prose + one footnote + extensive dialogue (handled as paragraphs per existing rule); no new block kinds needed, no new heuristics needed.

## Block counts by kind

| kind      | count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 41    |
| footnote  | 1     |
| **total** | 43    |

## Verse verdict

**Zero verse emitted.** Two stretches of italicized first-person dialogue (Jim's whiskey-in-milk on pp57-58, Fred's Washington dinner on p62) were candidates for false-positive verse detection. Per conventions, dialogue and italicized pull-quotes inline with prose stay in the surrounding `paragraph` block. Both passages integrate correctly into paragraphs p021 and p035 respectively. No borderline cases held as paragraph — the conventions' rule is unambiguous for this chapter.

## Drop-cap verdict

**Clean merge.** ParkAvenue `M` at 51.6pt on p51 y=125.7 merged with the NewCaledonia-SC follower line `ost of us have been unwilling to admit we` → `Most of us have been unwilling to admit we`. No visible artifact, no gap, no stray space. First paragraph ends cleanly at `…pursue it into the gates of insanity or death.`

## Footnote

One footnote, on page 55: `* True when this book was first published. But a 2003 U.S./Canada membership survey showed about one-fifth of A.A.'s were thirty and under.` It is a two-line footnote whose continuation line happens to use a different font (NewCaledonia rather than TimesLTMM). The join logic uses size (`<= 9.0`) rather than font, which correctly captures both lines. Leading `*` preserved.
