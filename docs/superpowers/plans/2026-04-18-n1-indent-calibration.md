# N1 indent-rule calibration — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current N1 indent-as-paragraph-break rule with per-section body-margin detection + uppercase-letter guard, so that sections with non-zero body-margin indent (ch02, ch05-ch09, ~40 personal stories) stop being over-segmented into one-block-per-line.

**Architecture:** Two module-private helpers in `scripts/extract-en-book/normalize.ts` (`computeBodyMargin` using mode-of-widths, `startsWithUppercaseAlpha` using leading-punctuation strip + ASCII case check) feed a single replacement loop that marks paragraph-start lines by the predicate `indent >= bodyMargin + 3 AND first-alpha-char is uppercase`. The first non-blank line of the section is always a paragraph-start. No changes to segment, pipeline, or any other extractor module.

**Tech Stack:** TypeScript (ESM via tsx), Vitest. Full spec at `docs/superpowers/specs/2026-04-18-n1-indent-calibration-design.md`.

**Branch:** `fix/n1-indent-calibration` (off `main` at `48068c5`; spec commit `b03ed70` already on branch).

---

## File structure

- **Modify** `scripts/extract-en-book/normalize.ts` — add 2 helpers, replace N1 loop, remove unused `INDENT_START`.
- **Modify** `tests/scripts/extract-en-book/normalize.test.ts` — add 4 tests (N5-N8).

No new files. No other module touched.

---

## Task 1: RED — failing tests for calibrated N1

**Files:**

- Test: `tests/scripts/extract-en-book/normalize.test.ts`

- [ ] **Step 1.1: Read the current test file to learn its fixtures/helpers**

Run: `cat tests/scripts/extract-en-book/normalize.test.ts | head -30`

Expected: confirms imports (`import { normalize } from '../../../scripts/extract-en-book/normalize'`) and test style.

- [ ] **Step 1.2: Append the four new tests at the end of the file**

Open `tests/scripts/extract-en-book/normalize.test.ts`. Before the final closing line (if there is a top-level `describe` wrapper), add these four `it()` blocks inside it. If tests are flat `describe`/`it` pairs, add as a new `describe('normalize — N1 calibration (Task 19)', ...)` block.

```typescript
describe('normalize — N1 calibration (Task 19)', () => {
  it('N5: splits ch02-style body-margin 10 / paragraph-indent 14', () => {
    const raw = [
      '          held us together as we are now joined.',
      '              The tremendous fact for every one of us is that we',
      '          have discovered a common solution. We have a way',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'There is a Solution' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toMatch(/joined\.$/)
    expect(paragraphs[1]).toMatch(/^\s*The tremendous fact/)
  })

  it('N6: drop-cap continuation (lowercase at high indent) stays in paragraph', () => {
    const raw = [
      '           I believe it would be good to tell the story of my',
      '                life. Doing so will give me the opportunity to re-',
      '          member that I must be grateful to God and to those',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Gratitude in Action' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(1)
  })

  it('N7: mid-sentence continuation at body margin does not split', () => {
    const raw = [
      '          I was powerless over alcohol. I was learning that I',
      '          could do nothing to fight it off,',
      '          even while I was denying the fact.',
      '             On Easter weekend 1944, I found myself in a jail',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Gratitude in Action' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toMatch(/denying the fact\.$/)
    expect(paragraphs[1]).toMatch(/^\s*On Easter weekend 1944/)
  })

  it("N8: regression — Bill's Story body-margin 0 with 3-space paragraph indent still splits", () => {
    const raw = [
      'burg were assigned, and we were flattered when the',
      'first citizens took us to their homes, making us feel',
      'heroic. Here was love, applause, war; moments sublime',
      '   My brother-in-law is a physician, and through his',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: "Bill's Story" })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toMatch(/moments sublime$/)
    expect(paragraphs[1]).toMatch(/^\s*My brother-in-law/)
  })
})
```

- [ ] **Step 1.3: Run tests to confirm all 4 new ones fail**

Run: `npm run test -- tests/scripts/extract-en-book/normalize.test.ts`

Expected: 4 failures (N5, N6, N7, N8). All existing normalize tests continue passing.

Why they fail against current impl:

- N5: current `INDENT_START = /^\s{3,}\S/` matches every body line → output has blank line before every line → `split(/\n\s*\n/)` returns 3+ paragraphs, not 2.
- N6: current rule fires on `life. Doing so will…` (16 spaces) → 2 paragraphs, not 1.
- N7: current rule fires on every 10-space body line → 3+ paragraphs, not 2.
- N8: current rule correctly fires on `My brother-in-law` (3 spaces). This test should PASS against current impl. If it fails, the input fixture is wrong — inspect and fix before moving on.

If N8 passes but N5/N6/N7 fail: proceed as planned.
If N8 fails: the regression fixture has a bug; fix and re-run.

- [ ] **Step 1.4: Commit RED**

```bash
git add tests/scripts/extract-en-book/normalize.test.ts
git commit -F - <<'EOF'
test(extract): N1 calibration RED — body-margin-aware paragraph detection

N5-N7: failing tests covering ch02 body-margin pattern, drop-cap
continuation, and mid-sentence continuation at body margin. N8:
regression guard for Bill's Story 3-space paragraph indent (passes
against current impl and must continue passing after calibration).

Part of #35.
EOF
```

Verify: `git log --oneline -1` shows `test(extract): N1 calibration RED — body-margin-aware paragraph detection`.

---

## Task 2: GREEN — calibrated N1 implementation

**Files:**

- Modify: `scripts/extract-en-book/normalize.ts`

- [ ] **Step 2.1: Read the current `normalize.ts` to refresh context**

Run: `cat scripts/extract-en-book/normalize.ts`

Confirm: `INDENT_START = /^\s{3,}\S/` is the only place to replace; `DROP_CAP`, `PAGE_ARTIFACTS`, and `rejoinHyphens` remain unchanged.

- [ ] **Step 2.2: Add the two helpers above the `normalize` function**

Insert these three functions after the constants block (after `INDENT_START` which will be removed in step 2.4) and before `export function normalize(...)`:

```typescript
function leadingWhitespaceWidth(line: string): number {
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
  const stripped = line.replace(
    /^[\s\d.,;:!?()[\]{}'"\u2018\u2019\u201c\u201d\u2013\u2014`*-]+/,
    '',
  )
  const first = stripped.charAt(0)
  return first >= 'A' && first <= 'Z'
}
```

- [ ] **Step 2.3: Replace the N1 paragraph-break loop inside `normalize()`**

Find this block in `normalize()`:

```typescript
// N1: insert a blank line before any line that begins with 3+ spaces.
// Layout-mode output uses leading indent to mark a new paragraph start.
// N2: collapse the drop-cap whitespace gap on each line.
const out: string[] = []
for (const [i, line] of kept.entries()) {
  if (i > 0 && INDENT_START.test(line)) {
    const prev = out[out.length - 1] ?? ''
    if (prev.trim() !== '') out.push('')
  }
  out.push(line.replace(DROP_CAP, '$1$2'))
}
```

Replace with:

```typescript
// N1 (calibrated): per-section body-margin detection + uppercase guard.
// A line is a paragraph start iff its indent exceeds the section's
// body-margin by 3+ AND its first alphabetic char is uppercase. The
// first non-blank line of the section is always a paragraph start.
// N2: collapse the drop-cap whitespace gap on each line.
const bodyMargin = computeBodyMargin(kept)
const paragraphIndentThreshold = bodyMargin + 3
const out: string[] = []
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

- [ ] **Step 2.4: Remove the now-unused `INDENT_START` constant**

Delete this line from the constants block near the top of the file:

```typescript
const INDENT_START = /^\s{3,}\S/
```

- [ ] **Step 2.5: Run the normalize test file to verify all tests pass**

Run: `npm run test -- tests/scripts/extract-en-book/normalize.test.ts`

Expected: all tests pass (20/20 or however many — N5-N8 should flip to GREEN; existing tests unchanged).

If any existing normalize test fails: inspect — the new rule may have changed behavior for fixtures with non-zero body-margin that previously happened to be correct. Adjust the new rule ONLY if the existing test's intent was fundamentally right; otherwise, update the test (separate decision — escalate to Plantin via the scratchpad if unsure).

- [ ] **Step 2.6: Run the full extract-en-book test suite**

Run: `npm run test -- tests/scripts/extract-en-book/`

Expected: all tests pass (72/72 or thereabouts after adding 4 new ones).

- [ ] **Step 2.7: Run the full project test suite**

Run: `npm run test`

Expected: all tests pass (214/214 = previous 210 + 4 new).

- [ ] **Step 2.8: Run typecheck, lint, format:check**

```bash
npm run typecheck
npm run lint
npm run format:check
```

Expected: all three pass with no errors and no warnings.

If `format:check` warns on `normalize.ts`: run `npx prettier --write scripts/extract-en-book/normalize.ts`, re-run `format:check`, confirm clean.

- [ ] **Step 2.9: Commit GREEN**

```bash
git add scripts/extract-en-book/normalize.ts
git commit -F - <<'EOF'
feat(extract-en-book): N1 calibration — mode-based body margin + uppercase guard

Replace the flat "any 3+ space indent = paragraph start" rule with
per-section body-margin detection plus an uppercase-letter guard on
the first alphabetic char. Handles block-quoted chapters (ch02, ch05-
ch09) and personal stories (~40 of them) whose pdftotext output uses
a non-zero body-margin indent.

Closes #35.
EOF
```

Verify: `git log --oneline -1` shows the feat commit; `git log --oneline -2` shows both RED + GREEN commits in order.

---

## Subagent stop condition

Subagent STOPS after Task 2 commit is verified. Do NOT re-run the full extraction, do NOT commit artifact changes, do NOT push. Plantin (main session) takes over for Task 3.

---

## Task 3 (Plantin, post-subagent): refresh artifact

**Files:**

- Modify: `data/extractions/en-4th-edition.json`
- Modify: `data/extractions/sample-review.md`
- Unchanged: `data/extractions/en-4th-edition.raw.txt` (deterministic pdftotext output)

- [ ] **Step 3.1: Re-run extraction**

```bash
EXTRACTED_AT=2026-04-18T00:00:00Z npm run extract:en 2>&1 | tee /tmp/extract-run.log
```

Expected: runs to completion. Tail should say `wrote data/extractions/en-4th-edition.json (68 sections)` and `wrote data/extractions/sample-review.md`.

- [ ] **Step 3.2: Verify acceptance criteria against block counts**

```bash
grep -E "^(ch0[0-9]|story-)" /tmp/extract-run.log | awk '{print $NF, $0}' | sort -rn | head -20
```

Expected:

- ch01-bills-story: 80 blocks (unchanged — regression guard held)
- ch02-there-is-a-solution: drops below 100 (target: 50-80)
- Story block counts: drops below 80 each (target: 15-50)

If ch01 diverges from 80: N8 regression missed something — escalate back to implementation before proceeding.

If ch02/stories didn't drop: body-margin detection isn't firing correctly for those sections — inspect a single section's raw text, compute its mode manually, compare to what the code produced. Escalate.

- [ ] **Step 3.3: Spot-check sample-review for lowercase-start fragments**

```bash
grep -B1 '^\s*> [a-z]' data/extractions/sample-review.md | head -40
```

Expected: empty (or only lines where the `>` is followed by a quoted lowercase word like `"bathtub"` gin — inspect each hit manually; a true bug is a line starting with a bare lowercase word like `even while` or `life.`).

Confirm:

- `story-gratitude-in-action-p070` no longer exists as `"even while I was denying the fact."`
- `ch02-there-is-a-solution-p022` no longer exists as `"we can join in brotherly and harmonious action. This"`

- [ ] **Step 3.4: Commit refreshed artifact**

```bash
git add data/extractions/en-4th-edition.json data/extractions/sample-review.md
git commit -F .tmp/commit-msg.txt
```

Where `.tmp/commit-msg.txt` contains:

```
chore(extract): refresh EN artifact after N1 calibration

Re-ran extract:en on post-calibration normalize.ts. Block-count
improvements vs. previous artifact at 48068c5:

- ch01-bills-story: 80 blocks (unchanged, regression guard held)
- ch02-there-is-a-solution: [actual new count] blocks (was 348)
- Personal stories: [range] blocks per story (was 119-400)

No lowercase-start continuation fragments remain in sample-review.
raw.txt unchanged (deterministic pdftotext).

Closes #35.
```

Fill in the `[actual new count]` and `[range]` placeholders with real numbers from the extraction run before committing.

- [ ] **Step 3.5: Push and present to PO**

```bash
git push origin fix/n1-indent-calibration
```

Then present a summary to PO:

- Old vs new block counts (ch01, ch02, sampling of stories)
- Sample-review improvements (specific fragments gone)
- URL to the branch for them to inspect sample-review.md

**This is Plantin's stop-point per PO instruction — report back only when preview data is prepared.**

---

## Acceptance criteria (ported from spec)

- [x] Design spec approved and committed (`b03ed70`)
- [ ] All 4 new tests (N5-N8) pass after Task 2
- [ ] Full test suite (214 tests) green after Task 2
- [ ] Typecheck + lint + format:check clean after Task 2
- [ ] ch01 Bill's Story still produces 80 blocks after Task 3 re-extraction
- [ ] ch02 There Is A Solution block count drops below 100
- [ ] Personal-story block counts drop below 80 each
- [ ] Spot-check: no block in any section starts with a lowercase continuation fragment
- [ ] `story-gratitude-in-action-p070` no longer exists as `"even while I was denying the fact."`
- [ ] Refreshed artifact committed and branch pushed
