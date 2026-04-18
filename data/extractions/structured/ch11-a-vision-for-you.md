# ch11-a-vision-for-you — extraction report

## Summary

Chapter 11 "A Vision For You" (PDF pages 172..185, the final chapter of Part I).
Emitted **62 blocks total**: 1 heading, 56 paragraphs, 5 footnotes. Zero verse,
zero list-items, zero tables, zero bylines. No schema deviations.

High-level: the chapter is mostly body prose with substantial dialogue-in-prose
passages (nurse phone call, lawyer-prospect exchange, the "jittery and alone"
second-person dialogue). Per conventions, all dialogue stays inside its
surrounding paragraph block — no verse emitted.

## Method

- PyMuPDF `page.get_text("dict")` over pages 172..185.
- Line-level filtering: drop top-of-page running headers (`y0 < 50`),
  bottom-of-page numeric-only page numbers (`y0 > 525`), and the "Chapter 11"
  italic label on p172.
- Body-paragraph boundary: `x0 ∈ [body_margin + 8, body_margin + 20]` (first-
  line indent detection). Body margin computed per-page as the min x0 of
  size-12 NewCaledonia lines.
- Drop-cap: ParkAvenue font, size > 40 on p172. Merged as `F` + first line
  text (no space) → "For most normal folks...". Wrap zone on p172 (`y0 < 190`)
  treated as continuation of the first paragraph, not a new paragraph start,
  because the wrap lines sit at varying x0 (83.4, 65.9, 53.9) due to the
  drop-cap shape.
- Cross-line hyphenation: applied the current 18-prefix compound allowlist
  (`self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`,
  `one-`..`ten-`). No compound split cases fired in this chapter — every
  cross-line `-` in the body was an ordinary line-break hyphen (`convivi-/ality`,
  `obses-/sion`, `com-/panionship`, `Anony-/mous`, `with-/out`, `be-/came`,
  etc.). All stripped-and-joined correctly.
- Footnote detection: on each of the 5 footnote pages (176, 177, 182, 183, 185)
  collected the run of `size <= 9` lines at `y0 > 475` starting from the one
  that begins with `*`. Emitted in page order at the end of the block list
  (same precedent as ch08-to-wives).

## Schema decisions

1. **Heading text** — `A VISION FOR YOU` (visual rendering) in the heading
   block; the section `title` metadata stays `A Vision For You` (prose case).
   Per conventions (accepted Wave 1B precedent).
2. **"Chapter 11" label** — dropped (not emitted), per conventions.
3. **Drop-cap merge** — the `F` glyph is at col ~53.5 on p172 and the
   continuation line starts with a small-caps tail `or most normal folks,`.
   Merged `F` + `or ...` → `For most normal folks, ...`. The small-caps tail
   naturally flattens to regular case via normalization since NewCaledonia-SC
   spans the uppercase forms of the chars as regular text.
4. **Dialogue kept as paragraphs** — multiple passages that older pipelines
   might have mistaken for verse or blockquote:
   - p173: the boy-whistling-in-the-dark imagined objection ("Yes, I'm willing.
     But am I to be consigned...").
   - p173: "How is that to come about?" / "Where am I to find these people?"
   - pp177-180: the nurse phone call, the two-friends-vs-lawyer exchange,
     ending with the "Damn little to laugh about that I can see" line.
   - p184: "I'm jittery and alone. I couldn't do that."
   - p185: "But I will not have the benefit of contact with you who write this
     book."

   All stayed inside regular `paragraph` blocks. None look verse-y once the
   paragraph-indent test is applied (they all begin at the paragraph-start
   indent, not a centered/narrow-column position).
5. **Footnote placement** — 5 footnotes appended at the end of the section in
   page order (pp176, 177, 182, 183, 185). This matches the ch08-to-wives
   precedent of placing footnotes after all body blocks rather than inline.
   Each carries its leading `*` marker per conventions.
6. **"(1939)" parenthetical** in p-051 (page 184) — kept inline with the
   surrounding paragraph ("This was only a few days ago at this writing.
   (1939)"). This is a parenthetical edition-update note typeset inline at
   body size, not a footnote — no `*` marker, no small-font separation.

## Flagged blocks

No hard uncertainties. A few spots worth noting:

- **p-023** (p177) ends with `"strapped down tight.”*` — the footnote marker
  `*` sits at the end of the closing dialogue quote. The corresponding
  footnote (f059) begins with `*` too, so cross-referencing works as per
  ch01/ch08 precedent. The `”*` adjacency in body text is visually a bit
  ugly but matches the source.

- **p-017** (p176) similarly ends with `be alcoholic.*` — this marker
  cross-references f058.

- **p-044** (p182) ends with `number many hundreds.*` → f060.
  **p-048** (p183) ends with `inform you.*` → f061.
  **p-054** (p185) ends with `fellowship you crave.*` → f062.

  All five markers cleanly preserved at the end of their referencing
  paragraphs.

- **Drop-cap wrap zone** — on p172 the first paragraph's wrap lines start at
  `x0 = 83.4` (line 2, still inside drop-cap wrap), `65.9` (line 3), then
  `53.9` (line 4 and onward, full-width body). The heuristic `y0 < 190` on
  p172 with `current is not None and current.kind == "paragraph"` catches
  these as continuations. Verified first paragraph reads correctly:
  "For most normal folks, drinking means conviviality, companionship and
  colorful imagination..."

## Schema proposals

None. The conventions doc (as of Wave 3 accepted state) handles this chapter
cleanly:

- No new BlockKind needed.
- No new compound-prefix needed (the 18-prefix allowlist had nothing to fire
  on here, and there were no false negatives — all cross-line hyphens in
  this chapter were ordinary word-break hyphens that stripped correctly).
- The 5-footnote-per-chapter case is the largest footnote count seen so far
  and the current "emit at end, in page order" pattern scales fine. The
  deferred Wave 1B proposal of optional `marker?`/`references?` fields is
  not needed here — each footnote is on a distinct page and they all use
  the same `*` marker sequentially down the page.
