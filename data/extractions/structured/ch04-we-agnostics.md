# ch04 — We Agnostics — extraction report

## Summary

Extracted **ch04-we-agnostics** (PDF pages 65..78) via PyMuPDF. Output contains **51 blocks**: 1 heading, 49 paragraphs, 1 footnote. **Zero verse**, zero blockquote, zero list-item, zero table, zero byline — as expected for this philosophical-argument chapter.

All section-specific concerns called out in the prompt resolved cleanly:

1. **Rhetorical dialogue ("Are we to spend the rest of our lives...")** — no such passage exists verbatim in ch04; the general rhetorical-question prose style (pp68, 69, 72, 73, 74) is rendered as normal paragraphs. No verse false-positive.
2. **Extended third-person anecdote about the minister's son** (pp76-78) — emitted as ordinary prose paragraphs (`p042`-`p050`). No special handling needed.
3. **Drop-cap 'I'** merged cleanly into first word `In` (no space).
4. **"Chapter 4" label** dropped per conventions.
5. **Heading `WE AGNOSTICS`** emitted at visual rendering; section `title` stays prose-case `We Agnostics` per the metadata/heading divergence convention.
6. **One footnote** on p68 (`* Please be sure to read Appendix II on "Spiritual Experience."`) emitted with leading `*` preserved, cross-referencing the `spiritual structure can be built.*` asterisk in paragraph `p012`.

## Method

- PyMuPDF `page.get_text("dict")` for per-line spans, fonts, sizes, and bbox.
- Probe script: `.tmp/probe-ch04.py` dumped every content line with y0/x0/x1/size/font metadata.
- Extractor: `.tmp/extract-ch04.py` (same skeleton as ch02's extractor).

Heuristics fired:

- Body font = NewCaledonia 12.0 on every page.
- Running-head strip: `y0 < 50` AND `size <= 9.5` (drops `WE AGNOSTICS` / `ALCOHOLICS ANONYMOUS` 9pt top-of-page headers). Kept the p65 section heading at `y0=99.6`, `size=13.5`.
- Top page-number strip: numeric-only lines with `y0 < 50` (pp65-78 have size-12 small-caps page numbers at y≈34).
- Bottom page-number strip: numeric-only lines with `y0 > 525`.
- `Chapter 4` italic 12.5 label on p65 — dropped per conventions.
- Heading detection: size ≥ 13.0 on p65.
- Drop-cap `I` (ParkAvenue 51.6pt at x0=73.5, y0=126.9 on p65) — merged into `n the preceding chapters...` producing `In the preceding chapters...` (no space).
- Paragraph-start detector: `body_margin + 8 <= x0 <= body_margin + 20`. Matches all 49 paragraph starts on both odd (~71 margin, indent ~83) and even (~54 margin, indent ~66) pages.
- Drop-cap wrap-zone on p65: the second line of the first paragraph (y<170, sitting at x≈94.6 past the drop-cap glyph) stays attached to the first paragraph.
- Footnote detection: `Times*` 8pt line starting with `*`. One footnote on p68 at y=522.2; single line, emitted at end of section (same precedent as ch02/ch08).

## Schema decisions

- **Heading text** is the visual rendering `WE AGNOSTICS` (matches conventions: `title` metadata stays prose-case `We Agnostics`; heading block carries the on-page form).
- **Drop-cap merge**: `I` + `n the preceding chapters you have learned` → `In the preceding chapters you have learned` (no space). The `NewCaledonia-SC` small-caps span on the first line is encoded as lowercase (`n the preceding chapters you have learned`), so merging with the drop-cap `I` yields natural sentence case without any extra transform.
- **Asterisk cross-reference marker** in body prose (`...spiritual structure can be built.*` on p68 in `p012`) preserved as-is, matching ch01/ch02 precedent. The footnote block carries a leading `*` so the cross-reference survives at both ends.
- **Footnote placement**: emitted at the tail of the block list (`f051`) rather than inline at its visual page position — same convention as ch02/ch08.
- **Italic rhetorical sentence on p77 emitted as its own paragraph**. The line `"Who are you to say there is no God?"` (NewCaledonia-Italic, y=343.4, x=83.0) sits at the paragraph-start indent for odd pages (body margin 71 + 12 = 83). The indent signal plus the introducing colon on the prior paragraph (`It crowded out all else:`) signals a displayed rhetorical insertion. Emitted as `p045` — a 1-line paragraph holding just the quoted question. Precedent: ch02 emits short dialogue-turn paragraphs (`p043` `He said to the doctor, "Is there no exception?"`) as standalone paragraphs when they sit at the paragraph-start indent. Italics alone did not drive this decision; the indent did.

## Flagged blocks

### Em-dash spacing at line ends (two occurrences)

Minor visual artifact: when the source line-break falls at an em-dash boundary, the extractor inserts a space either before or after the dash because the join rule only handles `-` hyphens (not `—` em-dashes). Resulting text is source-faithful but has a space where tight typography would not.

- **`ch04-we-agnostics-p004`** (p65): `"...we must find a spiritual basis of life —or else. Perhaps..."`. Source line-break: `...spiritual basis of life` + `—or else.` → joined as `life —or else.` with a leading space before the em-dash.
- **`ch04-we-agnostics-p028`** (p73): `"...we couldn't seem to be of real help to other people— was not a basic solution..."`. Source line-break: `...to other people—` + `was not a basic solution...` → joined as `people— was not` with a trailing space after the em-dash.
- **`ch04-we-agnostics-p043`** (p77): `"...suicide— these calamities..."`. Same pattern (em-dash at line end).
- **`ch04-we-agnostics-p048`** (p78): `"He humbly offered himself to his Maker— then he knew."`. Same pattern.

Not a verse signal, not a paragraph-boundary issue — just cosmetic. Flagged so later waves can decide whether the join rule should also strip/tighten at em-dash boundaries.

### Italic displayed rhetorical question

- **`ch04-we-agnostics-p045`** (p77): `"Who are you to say there is no God?"`. Single-line italic paragraph sitting at the paragraph-start indent (x=83, y=343.4). See Schema decisions above for rationale.

### Anecdote paragraphs (the narrative stress-test)

- **`ch04-we-agnostics-p042`**-**`ch04-we-agnostics-p050`** (pp76-78): the third-person anecdote about the minister's son who has a spiritual experience in a hospital room. Nine paragraph blocks of ordinary prose. No verse, no blockquote, no byline — this is body narrative, not an editorial interlude or story closing.

## Schema proposals

None. All conventions applied cleanly. The em-dash line-end spacing issue (see "Flagged blocks") is a minor rendering quirk that could justify a `join_paragraph_lines` refinement (strip leading/trailing whitespace around `—` at join points), but the fix would change behavior for ALL sections, not just ch04 — deferring to a cross-section convention update.

## Verse verdict

**Zero verse blocks emitted.** Scanned signals that could have mis-fired:

- Line-length < 50 chars: several short-tail lines exist (last lines of paragraphs, e.g. `of a great liner`-style), but they sit at the body margin (not at a shared-x center column) and have no surrounding blank-line or quote-mark grouping signals.
- Leading `"` on lines: present in multiple paragraphs (e.g. `p012` `"Do I now believe..."`, `p023` `"Let's look at the record."`, `p027` `"I bet they do it..."`, `p031` `"We don't know."`, `p044` `"If there is a God..."`, `p045` `"Who are you to say there is no God?"`). All are rhetorical quoted speech inside prose or (in `p045`) a displayed rhetorical sentence at para-indent. None trigger verse — correctly kept as paragraph blocks.
- Italic displayed sentence (`p045`): sits at para-indent, not at shared-x center column, not surrounded by blank lines in the source typography. Paragraph, not verse.

## Drop-cap verdict

**Clean merge.** Drop-cap `I` (ParkAvenue 51.6pt at x0=73.5, y0=126.9 on p65) was merged into the first body line's text `n the preceding chapters you have learned` producing `In the preceding chapters you have learned` with no intervening space. The second line of the first paragraph at y=155.3, x0=94.6 (wrap-indent past the drop-cap glyph) was kept attached via the drop-cap-wrap exception on p65 (y<170 stays with current paragraph). The third line at y=170.5, x0=71.0 (normal body margin — drop-cap glyph has ended) continues the paragraph naturally.

## Artifact files

- `/home/michelek/Documents/github/bigbook/data/extractions/structured/ch04-we-agnostics.json`
- `/home/michelek/Documents/github/bigbook/data/extractions/structured/ch04-we-agnostics.md`
- `.tmp/extract-ch04.py` — extractor script (disposable)
- `.tmp/probe-ch04.py`, `.tmp/ch04-probe.txt` — debug probe
