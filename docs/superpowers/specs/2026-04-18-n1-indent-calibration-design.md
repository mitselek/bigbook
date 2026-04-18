# N1 indent-rule calibration — design spec

**Date:** 2026-04-18
**Status:** Design approved, ready for plan
**Related:** Issue #35 · Task 17 batch (ad71181) · Task 19 (this work)

## Context

Task 17 (session 13) added an `indent-as-paragraph-break` rule (N1) to `scripts/extract-en-book/normalize.ts`. The rule fires on any line matching `/^\s{3,}\S/` and inserts a blank line before it so the downstream `segmentBlocks` splits on `\n\s*\n`.

N1 rescues chapters whose pdftotext output had no blank-line paragraph breaks (ch01 Bill's Story, ch03, ch04 went from 1 block each to 80/44/52 blocks in the refreshed artifact at commit `48068c5`).

**Problem:** N1 over-segments every section whose pdftotext layout uses a non-zero body-margin indent. In these sections, _every_ body line starts with 10+ leading spaces and fires the rule, producing one block per line instead of one per paragraph.

Observed block counts (refreshed artifact `48068c5`):

- ch01 Bill's Story: 80 blocks (correct — body margin is 0)
- ch02 There Is A Solution: **348 blocks** (real paragraph count: ~50-70)
- Personal stories (40 of them): **119-400 blocks each** (real count: ~15-30 per story)

Sample-review fragments produced by N1 over-segmentation:

- `story-gratitude-in-action-p004`: `"Canada in 1944."` — second line of a two-line subtitle, split at the indent boundary
- `story-gratitude-in-action-p070`: `"even while I was denying the fact."` — mid-paragraph body line at body margin, wrongly split
- `story-gratitude-in-action-p093`: `"Bobbie, who said words I hope I never forget: "I am"` — mid-paragraph fragment
- `ch02-there-is-a-solution-p022`: `"we can join in brotherly and harmonious action. This"` — lowercase-start continuation
- `story-women-suffer-too-p018`: `"a big easy chair, in the middle of…"` — lowercase-start continuation

## Problem statement

The current N1 rule assumes "any 3+ space indent = paragraph start". This is correct for sections with zero body margin (ch01 body lines start at column 0, paragraph starts at column 3). It fails for sections with a non-zero body margin, where _every_ body line has 10+ leading spaces.

We need a rule that distinguishes:

- **Body-margin indent** — the fixed left-margin of justified body text (e.g., 10 spaces for ch02 and most stories)
- **Paragraph-start indent** — extra first-line indent that signals a new paragraph (typically +3 spaces past body margin)

## Approach (approved)

Replace the current `INDENT_START` regex with two rules, applied per-section:

1. **Per-section body-margin detection.** Compute `bodyMargin` as the mode of leading-whitespace widths across all non-blank lines in the section's normalized-but-pre-N1 stream (i.e., after artifact-stripping, before paragraph-break insertion).

2. **Paragraph-start predicate.** A line is a paragraph start iff **BOTH**:
   - `leadingWhitespaceWidth(line) >= bodyMargin + 3`, AND
   - The first alphabetic character (after skipping leading whitespace, digits, punctuation, and quotes) is **uppercase**.

3. **Bypass rule.** The first non-blank line of the section is always a paragraph start (regardless of its indent). This handles the drop-cap opener of most stories, which is indented but shouldn't be gated by the threshold.

4. **Blank-line insertion.** As in current N1: insert a blank line before each marked paragraph-start line whose preceding kept line is non-blank. The downstream `segmentBlocks` splits on `\n\s*\n`.

### Why the uppercase guard

- Real paragraph starts begin with a capital letter, including:
  - Plain capitalized sentences (`The tremendous fact…`, `In June 1924…`)
  - Parenthesized-and-capitalized (`(3) Despite…`)
  - Quoted-and-capitalized (`"Bathtub" gin…`)
- Continuation lines start with a lowercase letter:
  - Mid-sentence wraps (`even while I was denying…`, `life. Doing so will…`, `burg were assigned…`)
  - Hyphenated word continuations (`mon peril is one element…`)

The uppercase guard catches the drop-cap continuation pattern specifically: in stories, the second line of the opening paragraph aligns under the drop-cap body text at a higher indent than the body margin (e.g., 16 spaces vs. body margin 10). The indent test alone would false-positive; the uppercase test correctly rejects it.

### Edge case: empty / all-blank section

If a section has no non-blank lines (shouldn't happen, but guard anyway), `computeBodyMargin` returns 0. N1 becomes the original behavior. Safe degrade.

### Edge case: section with exactly one content line

Only the bypass rule applies; no other paragraph starts. Safe.

## Code shape

### `scripts/extract-en-book/normalize.ts`

Add two helpers (module-private):

```typescript
function leadingWhitespaceWidth(line: string): number {
  // Count leading \s chars. Form-feed and tab count as 1 each.
  const match = line.match(/^\s*/)
  return match ? match[0].length : 0
}

function computeBodyMargin(lines: string[]): number {
  const widths = lines.filter((l) => l.trim() !== '').map(leadingWhitespaceWidth)
  if (widths.length === 0) return 0
  const counts = new Map<number, number>()
  for (const w of widths) counts.set(w, (counts.get(w) ?? 0) + 1)
  let mode = 0
  let max = 0
  for (const [w, c] of counts) {
    if (c > max) {
      max = c
      mode = w
    }
  }
  return mode
}

function startsWithUppercaseAlpha(line: string): boolean {
  // Strip leading whitespace, digits, punctuation, quotes, dashes.
  // Find the first alphabetic char; test if uppercase.
  const stripped = line.replace(
    /^[\s\d.,;:!?()[\]{}'"\u2018\u2019\u201c\u201d\u2013\u2014`*-]+/,
    '',
  )
  const first = stripped.charAt(0)
  return first >= 'A' && first <= 'Z'
}
```

Replace the current N1 loop:

```typescript
// before (current)
for (const [i, line] of kept.entries()) {
  if (i > 0 && INDENT_START.test(line)) {
    const prev = out[out.length - 1] ?? ''
    if (prev.trim() !== '') out.push('')
  }
  out.push(line.replace(DROP_CAP, '$1$2'))
}
```

With:

```typescript
// after (calibrated)
const bodyMargin = computeBodyMargin(kept)
const paragraphIndentThreshold = bodyMargin + 3
let seenFirstContent = false
for (const [i, line] of kept.entries()) {
  const isBlank = line.trim() === ''
  let isParagraphStart = false
  if (!isBlank) {
    if (!seenFirstContent) {
      isParagraphStart = true
      seenFirstContent = true
    } else if (
      leadingWhitespaceWidth(line) >= paragraphIndentThreshold &&
      startsWithUppercaseAlpha(line)
    ) {
      isParagraphStart = true
    }
  }
  if (isParagraphStart && i > 0) {
    const prev = out[out.length - 1] ?? ''
    if (prev.trim() !== '') out.push('')
  }
  out.push(line.replace(DROP_CAP, '$1$2'))
}
```

Delete the now-unused `INDENT_START` constant.

## Tests

New RED tests in `tests/scripts/extract-en-book/normalize.test.ts`:

### N5 — ch02 body margin pattern

**Input** (10-space body margin, 14-space paragraph indent):

```
          held us together as we are now joined.
              The tremendous fact for every one of us is that we
          have discovered a common solution. We have a way
```

**Context:** `sectionTitle: 'There is a Solution'`

**Assertion:** output splits on `\n\s*\n` into exactly 2 paragraphs. Paragraph 1 ends with `…joined.`. Paragraph 2 begins with `The tremendous fact…`.

### N6 — drop-cap continuation stays in paragraph

**Input:**

```
           I believe it would be good to tell the story of my
                life. Doing so will give me the opportunity to re-
          member that I must be grateful to God and to those
```

**Context:** `sectionTitle: 'Gratitude in Action'`

**Assertion:** output split on `\n\s*\n` produces exactly 1 paragraph. The `life.` line (lowercase start, 16-space indent) stays joined.

### N7 — mid-sentence continuation at body margin doesn't split

**Input:**

```
          I was powerless over alcohol. I was learning that I
          could do nothing to fight it off,
          even while I was denying the fact.
             On Easter weekend 1944, I found myself in a jail
```

**Context:** `sectionTitle: 'Gratitude in Action'`

**Assertion:** 2 paragraphs. First ends with `…denying the fact.`. Second begins with `On Easter weekend 1944…`.

### N8 — regression: ch01 Bill's Story 3-space indent still splits

**Input** (0-space body margin, 3-space paragraph indent):

```
burg were assigned, and we were flattered when the
first citizens took us to their homes, making us feel
heroic. Here was love, applause, war; moments sublime
   My brother-in-law is a physician, and through his
```

**Context:** `sectionTitle: "Bill's Story"`

**Assertion:** 2 paragraphs. First ends with `…moments sublime`. Second begins with `My brother-in-law…`.

## Acceptance criteria

After implementation + artifact regeneration:

- [ ] All 4 new tests (N5–N8) pass
- [ ] Full test suite (≥214 tests) green
- [ ] Typecheck + lint + format:check clean
- [ ] ch01 Bill's Story still produces 80 blocks (regression guard)
- [ ] ch02 There Is A Solution block count drops below 100 (target: 50-80)
- [ ] Personal-story block counts drop below 80 each (target: 15-50)
- [ ] Spot-check sample-review.md: no block in any section starts with a lowercase continuation fragment
- [ ] `story-gratitude-in-action-p070` no longer exists as `"even while I was denying the fact."`

## Out of scope

- Per-block `pdfPage` tracking (currently every block reports its section's start page). Logged in issue #35 as deferred.
- Story-heading abbreviation expansion (Dr. → Doctor, A.A. → Alcoholic Anonymous). Deferred from Task 17 batch 1.
- Verse-section indent detection (some stories may have verse blocks with different indent signatures). Observed-but-unverified; re-inspect sample-review after this fix.
- `DROP_CAP` regex handling of _indented_ drop-caps (e.g., `           I    believe`). Current regex only matches drop-caps at column 0 (Bill's Story shape). Indented drop-caps leave an internal 4-space gap in the paragraph text (`I    believe`). Out of scope for N1 calibration — open a follow-up if spot-check after regeneration finds it visually distracting in sample-review.

## Execution

Single one-shot subagent with TDD discipline. Session 12 pattern (no team spawn, no XP-triple handoff).

**Ownership.** Plantin (main session) owns the full cycle end-to-end. The subagent executes mechanical steps under Plantin's direction; Plantin does not consider the work complete until refreshed preview data is in hand and ready for PO review.

Cycle:

1. Subagent writes N5-N8 RED tests and commits. Plantin verifies the commit landed and tests genuinely fail against current normalize.
2. Subagent implements the two helpers + replacement loop and commits. Plantin verifies tests GREEN + full suite + typecheck + lint + format:check.
3. Plantin re-runs `npm run extract:en` and commits the refreshed artifact (this is a Plantin-territory commit — artifact data, not code). Plantin inspects sample-review.md against acceptance criteria.
4. Plantin presents new preview data to PO. Only after PO review does work advance (close issue #35, merge branch, etc.).

Commits:

- `test(extract): N1 calibration RED — body-margin-aware paragraph detection` (subagent)
- `feat(extract-en-book): N1 calibration — mode-based body margin + uppercase guard` (subagent)
- `chore(extract): refresh EN artifact after N1 calibration` (Plantin)

Branch: `fix/n1-indent-calibration` (off `main` at `48068c5`).

**Stop condition.** Plantin reports back to PO _only_ when new preview data (sample-review.md + artifact JSON) is prepared and pushed. No interim pings.
