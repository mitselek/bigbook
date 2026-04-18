# story-our-southern-friend — extraction report

**Date:** 2026-04-18
**Wave:** 5 (per-section subagent)
**Input:** `legacy/assets/AA-BigBook-4th-Edition.pdf`, pages 223-233 (1-indexed).
**Output:** `data/extractions/structured/story-our-southern-friend.json`, 65 blocks.

## 1. Summary

Fifth personal-story extraction (Part II, "Pioneers of A.A."). "Our Southern Friend" — by the minister's-son southern farmer who asks "Who am I to say there is no God?". Eleven-page story, mostly dialogue-heavy prose. Explicit brief for this section: **verse-discipline stress-test** — prior pipelines emitted seven `verse` blocks; expected to be mostly dialogue and scriptural quotation, not true verse.

Final block count: **1 heading + 64 paragraphs = 65 blocks. Zero verse blocks emitted.** `parentGroup` preserved. No byline, no footnote, no list, no table.

## 2. Method

Reused the `extract-story-drbobs.py` skeleton (closest sibling — same parent group, same front-matter shape: story-number + heading + 2-line italic subtitle + drop-cap). PyMuPDF `page.get_text("dict")` for per-line bbox/font/size. Script lives at `.tmp/extract-story-southern-friend.py` (gitignored); probe at `.tmp/probe-southern-friend.py` / `.tmp/southern-friend-probe.txt`.

Heuristics that fired:

- Body margins alternate by page parity: odd pages (223, 225, 227, 229, 231, 233) at x ≈ 69.28, paragraph indent ≈ 81.28. Even pages (224, 226, 228, 230, 232) at x ≈ 52.28, paragraph indent ≈ 64.28. Paragraph boundary = `x0 >= body_margin + 8`.
- Drop-cap: ParkAvenue 51.65 pt "F" at y ≈ 169.49 on p223 (x=68.87, AT the odd-page body margin). Surrounding body line wraps at x ≈ 102.03.
- Drop-cap wrap zone: lines at y < 214 on p223 with x ≈ 102 are continuations of the drop-cap paragraph wrapping around the glyph.
- Running-element filter: `y0 < 50` catches page-top 9pt headers ("OUR SOUTHERN FRIEND" on even pages, "ALCOHOLICS ANONYMOUS" on odd pages) AND the 12pt SC page numbers in the same zone. `y0 > 500 AND digits-only` catches the bottom-of-page SC page number `208` on p223.
- Story-number `(4) ` dropped via regex `^\(\d+\)\s*$` on p223 (y=78.96, font NewCaledonia-SC, size 13.50).
- Cross-line hyphenation handled via join-paragraph-lines with the Wave-3 compound-prefix allowlist (18 entries: `self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`, `one-` through `ten-`). No hits on the allowlist in this story — all cross-line hyphens were stripped as word-internal breaks.

Scripts written only under `.tmp/` (gitignored). No source-code changes.

## 3. Schema decisions

### Story-number `(4)` — **dropped entirely** (not bundled into heading)

Same policy as `story-gratitude-in-action` (story 2) and the pattern described in the conventions doc. Structural numbering, not authored content. Heading reads `OUR SOUTHERN FRIEND`.

### Subtitle — **emitted as single `paragraph` block**

The italic deck on page 223 spans two lines:

> Pioneer A.A., minister's son, and southern farmer,
> he asked, "Who am I to say there is no God?"

Both lines read as one continuous prose description (no separate clear first-line indents within the deck). Emitted as a single `paragraph` block per conventions default. Alternative of splitting into two paragraphs rejected because the second line is a continuation of the descriptive sentence, not a distinct paragraph.

### Drop-cap merge — `"F" + "ather"` → `"Father"` (no space separator)

Per conventions: single-letter drop-cap followed by the tail of the same word gets no space. The drop-cap `F` (ParkAvenue 51.65 pt) glyph reads `F\x00` in PyMuPDF and is joined to the first body line "ather is an Episcopal minister and his work" (first span in NewCaledonia-SC for the small-caps tail `FATHER IS`, flattened to regular case in the Unicode code points). Result: `Father is an Episcopal minister and his work...` — the intended sentence.

Contrast with ch01 (`W` + `ar` → `War`, no space) and dr-bobs / gratitude (`I` + next word with space, because `I` is itself a complete word).

### Byline — **no byline present**

The story ends with body prose: "I learn that honesty is truth and that truth shall make us free!" No italic attribution, no `-- Jon/Fitz M.` style sign-off. No `byline` block emitted.

### Compound-prefix allowlist — **current Wave 3 set used verbatim**

Used the Wave-3-accepted 18-entry allowlist. No cross-line hyphenation in this story matched the allowlist; all cross-line hyphens were treated as word-internal breaks and stripped:

- p223→p224: `Fresh-` + `man` → `Freshman`
- p225: `re-` + `member` → `remember`, `at-` + `tempts` → `attempts`, `be-` + `cause` → `because`
- p226: `collect-` + `ing` → `collecting`, `dis-` + `charged` → `discharged`, `for-` + `tunately` → `fortunately`
- p227: `morn-` + `ing` → `morning`, `an-` + `other` → `another`
- p228: `de-` + `feat` → `defeat`, `ar-` + `rangements` → `arrangements`, `alco-` + `holic` → `alcoholic`
- p229: `can-` + `not` → `cannot`
- p230: `hopeless-` + `ness` → `hopelessness`
- p231: `new-` + `found` → `newfound`, `prob-` + `lems` → `problems`, `under-` + `standing` → `understanding`
- p232: `tremen-` + `dous` → `tremendous`, `pre-` + `meditated` → `premeditated`
- p233: `be-` + `comes` → `becomes`

Preserved-on-same-line compound hyphens (not subject to cross-line logic): `self-pity`, `father-in-law`, `hail-fellow-well-met`, `crack-up`, `twenty-three`, `smoke-filled`, `cold-blooded`. All rendered correctly.

## 4. Verse verdict — **no verse blocks emitted**

Per the section-specific brief, this was a verse-discipline stress-test. Prior pipelines emitted 7 `verse` blocks for this story. I examined each candidate.

### Candidate 1 — p223 y=477..507: `"Let your light so shine before men that they may see your good works—."`

**Scripture citation (Matthew 5:16), quoted inline.** The narrator hears it from Father's sermon during a childhood memory. Rendered in the PDF as **prose wrapped across two body lines at the normal paragraph-indent x-coord (81.28 on odd page 223), not centered, not at a different x-column, with no blank-line bracketing**. Crucially, the quotation is **immediately followed on the same paragraph-start line by** narrator prose: `"...see your good works—." I hunt for my nickel to drop / in the plate so that mine will be seen.` That is, the quotation and the narrative continuation share a single paragraph.

**Verdict: paragraph (p006).** Opening `"` is not sufficient verse signal (conventions). No consistent-short-line verse form — the text wraps at the standard line width and flows into narrator prose.

### Candidate 2 — p224: `"Hail, hail, the gang's all here"` and `"Sweet Adeline"`

**Song titles quoted inline.** Present as parenthetical references within the sentence: `"as we sang "Hail, hail, the gang's all here" and "Sweet Adeline," who gave me / freedom from fear..."`. Not set off visually; not line-broken at verse-like positions.

**Verdict: paragraph (p012).** These are titles, not song lyrics rendered as verse.

### Candidate 3 — p229..230: dialogue exchanges between narrator and "the man"

Multiple short lines like `"I know it," I reply.` and `"I'll do anything," I reply.` rendered at the standard paragraph-indent. These are dialogue turns, typographically no different from surrounding prose except short line length.

**Verdict: paragraph (p036, p042, etc.).** Short line length alone is not verse. No consistent shared x-coord (they are at the paragraph-indent, not centered). No blank-line bracketing.

### Candidate 4 — p230 y=127.24: `"Who are you to say there is no God?"` (italicized)

The narrator's inner-voice thought, rendered in **NewCaledonia-Italic** for one line within an otherwise-regular paragraph. Context: `Then comes a thought that is like a voice. "Who / are you to say there is no God?" It rings in my head; / I can't get rid of it.` The italic spans a single line; the surrounding text is regular.

**Verdict: paragraph (p044).** Italic alone is not a split signal (conventions: "Italicized pull-quotes within prose... kept inline with the surrounding paragraph is the current precedent — italics alone is a weak split signal"). No shared x-coord (it's at body margin 52.28 like surrounding prose). No blank-line bracketing. Part of a single narrative paragraph.

### Candidate 5 — p230: prayer text `"God, here I am and here are all my troubles. I've made a mess of things..."`

Quoted dialogue from "the man" explaining how to pray. Rendered inline across 5 lines at the standard even-page paragraph layout. No centered form, no short lines, no blank-line bracketing.

**Verdict: paragraph (p048).** A dialogue turn containing a model prayer, not a standalone verse.

### Summary

- **Verse blocks emitted: 0.**
- **Verse signals checked per conventions:** short lines (<50 chars), shared centered x-coord, blank-line or quotes bracketing. **No candidate met all three.**
- Every prior "verse" in this story is either dialogue, italicized inner thought, or an inline scripture quotation — all of which the current conventions explicitly direct to keep in `paragraph`.

## 5. Flagged blocks

None flagged as uncertain. All 65 block boundaries matched the visual paragraph starts in the PDF on my cross-check against the probe output.

Two observations that could be revisited if a reader wants finer granularity:

- **p006** combines the scripture quotation `"Let your light so shine..."` with the narrator's continuation `I hunt for my nickel...` into a single paragraph because they share a paragraph-start indent and flow as one authored sentence. If downstream rendering wants the scripture called out, a later pass can split — but the source does not set it apart typographically.
- **p044** combines the italic-thought `"Who are you to say there is no God?"` with its surrounding prose (the lead-in `Then comes a thought that is like a voice.` and the tail `It rings in my head; I can't get rid of it.`). Same principle — a single authored paragraph in the source.

## 6. Schema proposals

None. The current conventions handled every edge case in this story cleanly:

- Drop-cap merge logic (single-letter + word-tail, no space) worked unchanged.
- Dialogue-in-paragraph rule kept dialogue exchanges intact without spurious verse false positives.
- Italic-inline rule kept the "voice" thought within its paragraph.
- Scriptural-inline rule kept "Let your light so shine" within its paragraph.
- Running-header filter worked unchanged (y0 < 50 alone was sufficient here; no front-matter-style heading-at-top-of-page confusion).
- Cross-page paragraph merge worked via the indent-based heuristic (no first-line indent on the continuation → merge).

## 7. Cross-check notes

Cross-page paragraph continuations verified for every page-boundary transition:

| Transition | Last-line on left page | First-line on right page | Verdict |
| --- | --- | --- | --- |
| 223→224 | `...college. "Fresh-` (indent 81.28) | `man," said he to me...` (margin 52.28) | MERGE p007 ✓ |
| 224→225 | `...pal, all right.` (margin 52.28) | `Final exams...` (indent 81.28) | SPLIT p012/p013 ✓ |
| 225→226 | `...sense of inferiority.` (margin 69.28) | `It is ten o'clock...` (indent 64.28) | SPLIT p017/p018 ✓ |
| 226→227 | `...in class and out.` (margin 52.28) | `The doctor bills...` (indent 81.28) | SPLIT p024/p025 ✓ |
| 227→228 | `...We have an-` (indent 81.28) | `other child...` (margin 52.28) | MERGE p030 ✓ |
| 228→229 | `...clean up the` (margin 52.28) | `debris. One man...` (margin 69.28) | MERGE p034 ✓ |
| 229→230 | `...thinking about myself` (margin 69.28) | `and a few things...` (margin 52.28) | MERGE p043 ✓ |
| 230→231 | `...people that joyous` (margin 52.28) | `before. We talk...` (margin 69.28) | MERGE p051 ✓ |
| 231→232 | `...But I have` (margin 69.28) | `not seen yet...` (margin 52.28) | MERGE p057 ✓ |
| 232→233 | `...I call my wife into a` (margin 52.28) | `room where we can talk...` (margin 69.28) | MERGE p062 ✓ |

All transitions behave correctly under the indent-based paragraph-boundary rule.
