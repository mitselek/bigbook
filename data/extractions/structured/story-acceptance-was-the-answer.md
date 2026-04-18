# story-acceptance-was-the-answer — extraction report

## Summary

Extracted Part II.B story #16 "Acceptance Was the Answer" (pp. 418–431, 14 pages — the longest in Wave 7). Emitted **39 blocks**: 1 `heading`, 38 `paragraph`. No list-items, no verse, no footnote, no table, no blockquote, no byline. Story ends with the exclamation `"Thank God for A.A.!"` with no author sign-off.

Wave 5–6 rules all apply cleanly. Three minor refinements needed for this section are documented below (section-specific compound extension, number-prefix tail extension, and an em-dash-at-line-start join rule).

## Method

- **Library:** PyMuPDF `page.get_text("dict")` only.
- **Line filtering:** running-header drop (`y0 < 50 AND (size <= 9.5 OR text.isdigit())`) and bottom-of-page page-number drop (`text.isdigit() AND y0 > 500`). Story-number `(16)` line on p418 dropped via the `^\(\d+\)\s*$` prefix regex.
- **Heading detection:** size ≥ 13.0 AND text contains "ACCEPTANCE" on the first page (y=102.46, size=13.50).
- **Subtitle detection:** italic `NewCaledonia-Italic` lines at size ~11pt with `y0 < 170` on the first page. Collected 3 lines.
- **Drop-cap merge:** `I` (ParkAvenue 51.65 at y=182.99) + first body line `'f there ever was anyone...'` (NewCaledonia-SC size 12) → `"If there ever was anyone..."` (no space, single-letter drop-cap + word-remainder). Small-caps tail arrives as real lowercase codepoints; post-flatten pronoun-`I` regex `\bi\b → I` applied to the merged first line (no effect here since the first `I` is already the drop-cap and the rest were already uppercase).
- **Drop-cap wrap:** body lines with `y0 < dropcap_y + 45` and `x0 > body_margin + 15` on the first page are attached to the drop-cap paragraph rather than treated as new paragraph starts.
- **Body-paragraph split:** first-line indent past body margin. Even pages: body margin 52.28, indent 64.28. Odd pages: body margin 69.28, indent 81.28.
- **Cross-page paragraph merge:** right-margin carry-over heuristic. When the last line of page N ends near the right margin (`x1 > 280`) and the first line of page N+1 starts at the body margin (not the indent), merge. Fired at the p430→p431 boundary (`"the newcomer"` → `"to A.A., last..."`).
- **Line-join rules:** cross-line hyphenation with compound-prefix allowlist (Wave 6 final list plus one section-specific addition, see below); em-dash at line-end joins without inserting a space (Wave 5 rule); em-dash at line-START of next line also joins without inserting a space (see Schema decisions).

## Schema decisions

### Story-number `(16)` — DROP

Per convention (lean-toward-drop): dropped via regex match on the first page. Not included in the heading.

### Subtitle — single paragraph block

The italic deck is 3 lines with a single first-line indent (x=76.28 line 1, continuations at x=64.27 lines 2–3). No structured multi-paragraph pattern → emit as a single `paragraph` block per the convention default.

Text: `"The physician wasn't hooked, he thought—he just prescribed drugs medically indicated for his many ailments. Acceptance was his key to liberation."`

### Drop-cap merge

Single-letter `I` + first body fragment `f there ever was anyone...` → `If there ever was anyone...`. No space inserted. Pronoun-`I` regex applied but was a no-op in this story's opening line.

### No byline

The closing line is `"Thank God for A.A.!"` (p431, indented-start paragraph). There is no `-- Joe M.`-style sign-off after this line. Verified no italic/right-aligned attribution block follows. Last paragraph emitted as `paragraph`, not `byline`.

### Em-dash-at-line-start join (section-specific refinement — but likely useful globally)

The Wave 5 rule says "do not insert a space when joining across a line where the PREVIOUS line ends with `—`". The mirror case appeared here on p422:

- Line n:   `"...I'll control myself"`  (no terminal punctuation, no hyphen)
- Line n+1: `"—with pills.'' Giving up alcohol alone..."`  (starts with em-dash)

Without a rule, the join inserts a space: `"myself —with pills"`. Visually wrong — the em-dash belongs to `myself`. Added a local rule: when the NEXT line starts with `—`, join with no space.

This generalizes the Wave 5 rule: em-dash is always glued to its adjacent word, regardless of which line it appears on.

### Capitalized-stem refinement (for this section's `Eventu-/ally`)

Wave 6 added: *preserve the hyphen when the stem before line-end `-` starts with an uppercase letter (e.g. `God-`, `Anglo-`).* Intended for proper-noun-prefix compounds.

This story has a page break at `"...way around. Eventu-"` → `"ally I had to redo..."`. The stem `Eventu` starts with uppercase `E` because it begins a sentence (previous text ended with `.`). The Wave 6 rule as written would preserve the hyphen → `Eventu-ally`, which is wrong.

Refinement applied locally: skip capitalized-stem preservation when the character preceding the stem is sentence-terminal punctuation (`.`, `!`, `?`, closing quote, `:`, `;`). Sentence-start uppercase is NOT a proper-noun-prefix signal. Proposal listed below.

### Number-prefix tail extension (for `thirty-five`)

Cross-line split on p429: `"thirty-"` / `"five years"`. The Wave 6 number-prefix qualification keeps the hyphen only when the next word is in the NUMBER_TAILS set `{half, third, quarter, fold, year, day, sided, degree, dollar, bit}`. `five` is not in that set, so the current rule strips the hyphen → `thirtyfive`.

But decade prefixes (`twenty-`..`ninety-`) combine with digit-words (`one`..`nine`) to form ages/counts: `twenty-five`, `thirty-six`, etc. Extended NUMBER_TAILS locally to include `one` through `nine`. Proposal listed below.

### Compound-prefix allowlist extension: `mind-`

Cross-line split on p422: `"give up all mood- and mind-"` / `"affecting chemicals..."`. Source uses the suspended-hyphen construction `"mood- and mind-affecting"` which is a grammatically legitimate English construction. Without a local extension the join produces `mindaffecting` (loses the hyphen, joins as single word).

Added `mind-` to COMPOUND_PREFIXES locally. This is a narrow section-specific addition because `mind-affecting` has a clear single-compound form. Unlike `pay-`/`fast-` (deferred in Wave 6 as ambiguous), `mind-affecting` is the conventional hyphenated compound in medical/recovery-vocabulary contexts and the source's suspended-hyphen sister `mood-` cements the intent.

Consider promoting to the shared allowlist if other sections also use this compound. For now: section-local.

## Flagged blocks

None. Every block passes sanity checks — no orphaned fragments, no obvious paragraph mismerges, no leaked running-header or page-number digits.

Block counts per page: 418=4, 419=4, 420=3, 421=2, 422=3, 423=1, 424=3, 425=2, 426=2, 427=3, 428=3, 429=2, 430=4, 431=3.

## Schema proposals

1. **Em-dash-at-line-start join rule (generalization of Wave 5 em-dash rule):** when joining two lines and the NEXT line begins with `—`, insert no space. Current rule only covers em-dash at line-END of the previous line. The mirror case is equally common (see p015 in this story). This tightens the em-dash-is-glued-to-its-word invariant.

2. **Sentence-start exception to capitalized-stem hyphen preservation:** when the stem before the line-end hyphen starts with uppercase AND the character immediately before the stem (ignoring spaces) is sentence-terminal (`.`, `!`, `?`, closing quote, `:`, `;`), treat as mid-word hyphenation (strip the hyphen), not as a proper-noun-prefix compound. Fixes `Eventu-ally → Eventually` without breaking `God-consciousness`.

3. **Extend NUMBER_TAILS for decade prefixes:** add digit-words (`one`..`nine`) to the set of allowed tails after a decade prefix (`twenty-`..`ninety-`), so that `thirty-five`, `forty-six`, etc. survive cross-line splits. Technically the digit-words should only fire for decade prefixes (not for small-number prefixes like `one-`, `two-`), but since `one-five` etc. don't exist in English the union is safe.

4. **Suspended-hyphen compound detection (defer — but note):** the construction `"mood- and mind-affecting"` is a legitimate English pattern where two hyphenated compounds share a common tail. Currently handled only when hyphen falls within a line. Cross-line break on the second member requires per-section recognition. Could be detected by the pattern `\bmood-\s+and\s+mind-\n?$` or similar, but that's a lexical pattern, not a structural one. Defer per Wave 4 "intra-line hyphen artifacts" guidance.

## Hard-constraint check

- Files written: `data/extractions/structured/story-acceptance-was-the-answer.{json,md}`.
- Extraction script under `.tmp/extract-story-acceptance.py`.
- No source-code changes. No commits, no pushes, no npm.
- JSON validated via `json.load`.
