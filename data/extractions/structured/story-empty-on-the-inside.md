# story-empty-on-the-inside — extraction report

## Summary

Personal story "Empty on the Inside" — Part III (They Lost Nearly All), story
`(10)`. PDF pages 518..527 (10 pages). 32 blocks emitted: **1 heading + 31
paragraphs**. No list-items, verse, footnotes, tables, or bylines. Parent group
`personal-stories/they-lost-nearly-all`.

This is the first Part-III (They Lost Nearly All) story to be extracted with
the structured pipeline — all prior-wave `parentGroup`s were
`personal-stories/pioneers-of-aa` and `personal-stories/they-stopped-in-time`.
Structure turned out to be conventional for a post-Wave-7 story: heading +
italic subtitle + drop-cap + ordinary prose. No new schema proposals.

## Method

- PyMuPDF `page.get_text("dict")` for lines with bbox + font + size.
- Body font NewCaledonia 12.0 (NewCaledonia-SC for the first body line after
  drop-cap; PyMuPDF returns real lowercase codepoints so small-caps flattening
  is a no-op).
- Body margins: **even pages (518, 520, 522, 524, 526) x=69.28**; **odd pages
  (519, 521, 523, 525, 527) x=52.28**. First-line paragraph indent is
  body-margin + 12 (threshold set at body-margin + 8).
- Drop-cap detection: ParkAvenue font, size > 40pt. Merged into first body line.
- Cross-page paragraph merge: right-margin carry-over heuristic
  (`last.x1 > 280` AND next block's first line is at body margin, not indented).
- Running headers dropped with `y0<50 AND (size<=9.5 OR text.isdigit())`.
  Story-number `(10)` dropped on first page via regex `^\(\d+\)\s*$`.

## Schema decisions

- **Story-number `(10)`** — dropped per conventions (structural numbering, not
  authored content). Shown as a `NewCaledonia` 12.5pt line at y=79 above the
  heading on page 518.
- **Drop-cap merge** — the drop-cap is the pronoun `I` (ParkAvenue 51.65 at
  y=168.85). It is a complete standalone word, and the first body word
  (`spent`) is separate, so the merge inserts a **space**:
  `"I" + " " + "spent my life..."` → `"I spent my life..."`. This follows the
  Wave 2 convention:

  > When the drop-cap is a standalone single-letter word like `I` followed by
  > a complete separate word (`I believe`), insert a space. When it's the
  > first letter of a word continued on the next line (`W` + `ar` → `War`),
  > no space.

  The defensive `\bi\b → I` post-flatten regex is applied; here it's a no-op
  because the first body line is in small-caps font (PyMuPDF returns
  lowercase codepoints for the running text, but there is no lone `i` glyph
  in this first line — the pronoun `I` occurrences are on subsequent lines
  already in regular font).
- **Drop-cap wrap-zone x-offset** — `I` is a narrow glyph, so the wrap-zone
  threshold is `body_margin + 20` (not `+35` used for W/M/P). Two body lines
  (y=182.06 and y=196.83 at x=94.53) are recognized as wrap-zone lines and
  attach to the drop-cap paragraph; the third line (y=211.60, x=69.28) reverts
  to body margin and continues the same paragraph.
- **Subtitle** — 2 italic lines at y=130.71 (x=93.28, first-line indent) and
  y=144.48 (x=81.27, continuation). Single indent group → emitted as a single
  `paragraph` block per the default rule. The en-dash-style phrase
  `answers—except` is joined across the line without a space (em-dash at
  line-end rule).
- **Superscript fractions** — `2 1⁄2 years` (p522) and `29 1⁄2` (p524) render
  in the PDF as the host body line plus interleaved `size=6.0` spans
  (`' '`, `'1'`, `'2'`). PyMuPDF's `get_text("dict")` already concatenates all
  spans of a logical line into a single `text` field in reading order, so the
  assembled line text `"the way I wanted to for 2 1⁄2 years..."` was
  correct as-is. No custom fold step was required for this story; both
  occurrences serialize cleanly into the output text.
- **Section-specific hyphen tweak — `so-` dropped from allowlist.** The story
  has exactly one `so-` cross-line split (p520→p520 `I was a so-` / `cial
  drinker...`). The correct join is `social`, not `so-cial`. Since this story
  has no `so-called`-style cross-line break, removing `so-` from
  `COMPOUND_PREFIXES` for this section is safe and correct. All 29 other
  cross-line hyphen joins verified manually (see spot-check table below).

## Cross-line hyphen joins (all verified)

All 30 cross-line hyphen boundaries in the story resolve correctly with the
(section-modified) allowlist:

| Line-end | Next-line | Resolved |
| -------- | --------- | -------- |
| `drink-` | `ing` | `drinking` (strip) |
| `treat-` | `ment` | `treatment` (strip) |
| `inade-` | `quate` | `inadequate` (strip) |
| `any-` | `way` | `anyway` (strip) |
| `so-` | `cial` | `social` (strip; allowlist adjusted) |
| `excel-` | `lent` | `excellent` (strip) |
| `con-` | `taining` | `containing` (strip) |
| `moth-` | `ers` | `mothers` (strip) |
| `inher-` | `ited` | `inherited` (strip) |
| `un-` | `pack` | `unpack` (strip) |
| `mo-` | `ment` | `moment` (strip) |
| `pa-` | `rade` | `parade` (strip) |
| `treat-` | `ment` | `treatment` (strip) |
| `al-` | `ready` | `already` (strip) |
| `some-` | `one` | `someone` (strip) |
| `re-` | `sponsible` | `responsible` (strip; `re-` not in allowlist per Wave 2) |
| `be-` | `cause` | `because` (strip) |
| `mat-` | `ter` | `matter` (strip) |
| `any-` | `more` | `anymore` (strip) |
| `sev-` | `eral` | `several` (strip) |
| `my-` | `self` | `myself` (strip) |
| `remem-` | `ber` | `remember` (strip) |
| `chil-` | `dren` | `children` (strip) |
| `relation-` | `ship` | `relationship` (strip) |
| `at-` | `tempt` | `attempt` (strip) |
| `al-` | `coholic` | `alcoholic` (strip) |
| `prod-` | `uct` | `product` (strip) |
| `be-` | `lieving` | `believing` (strip) |
| `chil-` | `dren` | `children` (strip, second occurrence) |

All intra-line compound hyphens (`twenty-eight`, `nine-year-old`, `one-night`,
`third-` (as in "third generation"), etc.) are preserved as-is — they never
hit the cross-line join path.

## Flagged blocks

None. All 32 blocks pass manual review:

- `h001` — "EMPTY ON THE INSIDE" (heading).
- `p002` — subtitle paragraph (2-line italic deck, single indent group).
- `p003` — first body paragraph with drop-cap `I` merge.
- `p005` — spans page break p518 → p519 ("... went to open A.A. meetings
  because we couldn't afford a babysitter..."); right-margin carry-over
  heuristic fired. Verified merge is correct.
- `p014`, `p022` — paragraphs containing the `1⁄2` fractions.
- `p032` — final paragraph closes with "...it is all right not to know."
  (matching the story's opening theme). No byline — story is unsigned, which
  is common in Part III stories.

## Schema proposals

None. The conventions doc's cumulative Wave 1-7 rules cover every structural
feature encountered in this story. The only section-specific adjustment was
removing `so-` from `COMPOUND_PREFIXES` for this extraction, which is a
per-section allowlist tuning (not a conventions change) — documenting here
for transparency in case Wave 8 surfaces a pattern across multiple sections
that would warrant a conventions refinement.

### Note (for Plantin's consideration, not a proposal)

The `so-cial` false positive is a known class of issue: `so-` is a valid
Wave 3 allowlist entry for `so-called`, but `social` is a common English word
that happens to split on the `so-` boundary when set ragged-right. Across all
68 sections, there are likely other `social` cross-line splits that would
produce `so-cial` with the default allowlist. If Wave 8 finds more, a
conventions refinement could add a number-prefix-style qualification to `so-`
(`so-` keeps hyphen only when next word is `called`). Current per-section
workaround is adequate.

## Block counts

- Total: **32**
- `heading`: 1
- `paragraph`: 31
- `list-item`, `verse`, `blockquote`, `footnote`, `table`, `byline`: 0 each
- Total characters across all `text` fields: ~15,903
