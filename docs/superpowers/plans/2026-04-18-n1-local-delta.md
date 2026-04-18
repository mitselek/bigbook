# N1 local-delta paragraph detection — plan

**Goal:** Replace mode-based body-margin detection in `normalize.ts` with a simpler local-delta rule. Fixes the two-body-margin bug seen in Gratitude in Action and other justified-layout sections (ch02, ch05-ch09, stories) where uppercase-starting body lines on the "other" page margin were false-fired as paragraph starts.

**Root cause:** Book layout uses different body-text margins on left (verso) vs. right (recto) pages. Sections routinely have ~100+ lines at each margin. The mode picks one; lines at the other margin exceed `mode + 3`, and uppercase ones (like "Bobbie,", "Book in the mail") false-fire as paragraph starts.

**Rule change:**

- Before: `indent >= bodyMargin + 3` where `bodyMargin = mode(widths)`
- After: `indent >= previousNonBlankIndent + 3` (compare each line to its immediate predecessor, not to a global statistic)

First-content-line bypass and uppercase-alpha guard both remain.

**Branch:** `fix/n1-local-delta` off `main` at `92f62b1`.

---

## Task 1: RED — failing test for two-body-margin case

**File:** `tests/scripts/extract-en-book/normalize.test.ts`

- [ ] **1.1:** Append a new `describe` block at end of file:

```typescript
describe('normalize — N1 local-delta (Task 22)', () => {
  it('N9: two-body-margin section does not false-fire uppercase body lines', () => {
    // Fixture modeled on Gratitude in Action (pages 208-209 / book pages
    // 193-194). The book's justified layout uses 10-space body margin on
    // odd pages and 14-space body margin on even pages. Paragraph starts
    // on odd pages are at 13 spaces; on even pages at 17 spaces.
    //
    // When the section spans both page types, the older mode-based rule
    // picks one margin (say 10) as `bodyMargin` and sets threshold = 13.
    // Uppercase-starting body lines at 14 then exceed the threshold and
    // false-fire as paragraph starts (observed: "I finally spoke to a
    // woman,", "Bobbie, who said...", "Book in the mail..." all became
    // standalone blocks).
    //
    // The fixture has 7 lines at 10 (odd-page body), 5 lines at 14 (even-
    // page body, including two uppercase-starting lines), and 1 line at
    // 17 (real even-page P-start). Mode = 10, threshold = 13. Under the
    // OLD rule, lines 11 ("I finally...") and 12 ("Bobbie,...") at 14
    // spaces with uppercase starts would fire as false P-starts.
    //
    // Under local-delta, lines 11 and 12 compare to their immediate
    // predecessor (also 14-indent), so 14 < 14+3 → do not fire.
    const raw = [
      '          later I came to understand that A.A.',
      '          members were helping each other every day.',
      '          That message finally reached me.',
      '          I knew it could work for me too.',
      '          I felt hope for the first time.',
      '          Even so, I struggled with doubt.',
      '          Every day was a battle with fear.',
      '              was transformed. Alcohol suddenly made me into',
      '              what I had always wanted to be.',
      '              used it only at parties and meetings.',
      '              I finally spoke to a woman, a kind woman,',
      '              Bobbie, who said words I hope I never forget:',
      '                 Alcohol became my everyday companion.',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Gratitude in Action' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    // Expected: exactly 2 paragraphs under local-delta.
    //   1. Lines 1-12 as one flowing paragraph (no false-fires on
    //      "I finally spoke..." or "Bobbie, who said..." at 14-indent).
    //   2. Line 13 "Alcohol became my everyday companion." (17-indent
    //      P-start).
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toMatch(
      /later I came to understand[\s\S]*Bobbie, who said words I hope I never forget:/,
    )
    expect(paragraphs[1]).toMatch(/^\s*Alcohol became my everyday companion\.$/)
  })
})
```

- [ ] **1.2:** Run `npm run test -- tests/scripts/extract-en-book/normalize.test.ts`. Confirm N9 fails under the current mode-based rule (mode=10, threshold=13, uppercase 14-indent lines "I finally spoke..." and "Bobbie, who said..." false-fire, producing 4 paragraphs instead of 2). All other tests still pass.

- [ ] **1.3:** Write commit message to `.tmp/commit-msg.txt`:

```
test(extract): N1 local-delta RED — two-body-margin sections

N9: sections with book-layout justification have two body margins
(left/right pages, ~10 and ~14 spaces). Uppercase-starting body lines
on the "other" margin must not false-fire as paragraph starts under
the revised local-delta rule.
```

Commit: `git add tests/scripts/extract-en-book/normalize.test.ts && git commit -F .tmp/commit-msg.txt`

---

## Task 2: GREEN — replace mode-based with local-delta

**File:** `scripts/extract-en-book/normalize.ts`

- [ ] **2.1:** Delete the `computeBodyMargin` function (no longer needed).

- [ ] **2.2:** Replace the paragraph-detection loop inside `normalize()`. The current code (after Task 17 + N1 calibration + page-boundary cleanup) looks like:

```typescript
// N1 (calibrated): per-section body-margin detection + uppercase guard.
// ...comment block...
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

Replace with:

```typescript
// N1 (local-delta): a line is a paragraph start iff its indent exceeds
// the preceding non-blank line's indent by 3+ AND its first alphabetic
// char is uppercase. This handles sections with multiple body margins
// (book-layout left/right pages) without a per-section statistic.
// First non-blank line of the section is always a paragraph start.
// N2: collapse the drop-cap whitespace gap on each line.
const out: string[] = []
let seenFirstContent = false
let lastNonBlankIndent = 0
for (const [i, line] of kept.entries()) {
  const isBlank = line.trim() === ''
  let isParagraphStart = false
  if (!isBlank) {
    const currentIndent = leadingWhitespaceWidth(line)
    if (!seenFirstContent) {
      isParagraphStart = true
      seenFirstContent = true
    } else if (currentIndent >= lastNonBlankIndent + 3 && startsWithUppercaseAlpha(line)) {
      isParagraphStart = true
    }
    lastNonBlankIndent = currentIndent
  }
  if (isParagraphStart && i > 0) {
    const prev = out[out.length - 1] ?? ''
    if (prev.trim() !== '') out.push('')
  }
  out.push(line.replace(DROP_CAP, '$1$2'))
}
```

- [ ] **2.3:** Run `npm run test -- tests/scripts/extract-en-book/normalize.test.ts`. Confirm N9 passes plus all existing tests (N5-N8, legacy N1, N2, etc.).

- [ ] **2.4:** Run `npm run test` — full suite 217/217 green.

- [ ] **2.5:** Run `npm run typecheck && npm run lint && npm run format:check`. Run `npx prettier --write scripts/extract-en-book/normalize.ts` if needed.

- [ ] **2.6:** Write commit message to `.tmp/commit-msg.txt`:

```
feat(extract-en-book): N1 local-delta — handles two-body-margin sections

Replace mode-based body-margin detection with local-delta: a line is
a paragraph start iff its indent exceeds the preceding non-blank
line's indent by 3+ AND its first alphabetic char is uppercase.

Mode-based detection failed for justified-layout sections (ch02,
ch05-ch09, stories) where left and right pages use different body
margins. Lines at the "other" margin exceeded `mode + 3` and, if
uppercase, false-fired (e.g., "Bobbie, who said..." and "Book in the
mail..." in Gratitude in Action were promoted to standalone blocks
despite being mid-paragraph continuations).

Local-delta compares each line to its immediate predecessor, so
two-body-margin sections naturally produce no false splits while
still detecting real paragraph indents on either page type.

computeBodyMargin helper removed (no longer needed).
```

Commit: `git add scripts/extract-en-book/normalize.ts && git commit -F .tmp/commit-msg.txt`

- [ ] **2.7:** Confirm with `git log --oneline -3`.

**Stop after Task 2 — Plantin handles Task 3 (artifact refresh).**

---

## Task 3 (Plantin): artifact refresh

- [ ] **3.1:** `EXTRACTED_AT=2026-04-18T00:00:00Z npm run extract:en 2>&1 | tee .tmp/extract-run.log`
- [ ] **3.2:** Verify: story-gratitude-in-action-p020 should now contain "Bobbie, who said..." as part of a longer paragraph, NOT as its own block starting with "Bobbie,".
- [ ] **3.3:** Commit, push, FF-merge main.
