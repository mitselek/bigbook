# Page-boundary cleanup (issues #36 + #37) — plan

> **For agentic workers:** Execute as a single RED+GREEN+refresh cycle. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close issues #36 (QXD header leak) and #37 (blank propagation stops at 1 line deep), both in `scripts/extract-en-book/normalize.ts`. Both surfaced during N1 calibration; bundling because they share the page-boundary root context.

**Branch:** `fix/page-boundary-cleanup` (off `main` at `b6c2cdd`).

**Tech stack:** TypeScript, Vitest. Both fixes are in one file (`normalize.ts`) and one test file.

---

## Task 1: RED — 2 failing tests (one per issue)

**Files:** `tests/scripts/extract-en-book/normalize.test.ts`

- [ ] **1.1:** Append a new `describe('normalize — page-boundary cleanup', ...)` block at the end of the file:

```typescript
describe('normalize — page-boundary cleanup', () => {
  it('strips QXD annotation with form-feed prefix (#36)', () => {
    const raw = [
      'paragraph one ends here.',
      '\fAlco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page 17',
      'paragraph two continues here.',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Any' })
    expect(out).not.toMatch(/Alco_.*\.qxd/)
  })

  it('strips all blank lines around a stripped running header (#37)', () => {
    const raw = [
      '          last line of page 81.',
      '',
      '',
      '',
      '',
      '              INTO ACTION                    81',
      '          first line of page 82 continues.',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Into Action' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toMatch(/last line of page 81[\s\S]*first line of page 82/)
  })
})
```

- [ ] **1.2:** Run `npm run test -- tests/scripts/extract-en-book/normalize.test.ts` — confirm both new tests fail (existing 16 tests still pass).

- [ ] **1.3:** Write commit message to `.tmp/commit-msg.txt` (overwrite prior contents):

```
test(extract): page-boundary cleanup RED — QXD leak + blank propagation

#36: QXD annotation with form-feed prefix should be stripped.
#37: All blank lines around a stripped running header should be
dropped, so paragraphs rejoin across page breaks.
```

Then: `git add tests/scripts/extract-en-book/normalize.test.ts && git commit -F .tmp/commit-msg.txt`

---

## Task 2: GREEN — implement both fixes

**Files:** `scripts/extract-en-book/normalize.ts`

- [ ] **2.1:** Fix #36 — widen the `QXD_HEADER` regex to allow leading whitespace (form-feed matches `\s`):

Change line 10:

```typescript
const QXD_HEADER = /^Alco_\w+_\d+p_\w+_r\d+\.qxd .+Page \d+$/
```

to:

```typescript
const QXD_HEADER = /^\s*Alco_\w+_\d+p_\w+_r\d+\.qxd .+Page \d+$/
```

- [ ] **2.2:** Fix #37 — extend Pass-2 to propagate strip through entire blank runs adjacent to stripped lines.

Replace the existing Pass-2 block:

```typescript
// Pass 2: propagate — a blank line adjacent to a stripped line is itself
// part of the page-break artifact and must be dropped. A blank line between
// two kept (non-stripped, non-blank) lines is a legitimate paragraph break
// and must be preserved.
for (const [i, line] of lines.entries()) {
  if (strip[i]) continue
  if (line.trim() !== '') continue
  const prevStripped = i > 0 && strip[i - 1] === true
  const nextStripped = i < lines.length - 1 && strip[i + 1] === true
  if (prevStripped || nextStripped) strip[i] = true
}
```

with:

```typescript
// Pass 2: propagate — runs of blank lines adjacent to a stripped line are
// part of the page-break artifact and must be dropped. A blank-run between
// two kept (non-stripped, non-blank) lines is a legitimate paragraph break
// and must be preserved.
//
// Walk forward from each stripped line, marking following blanks stripped
// until a non-blank is reached. Then walk backward similarly.
for (const [i] of lines.entries()) {
  if (!strip[i]) continue
  // forward
  for (let j = i + 1; j < lines.length; j++) {
    if (lines[j].trim() !== '') break
    strip[j] = true
  }
  // backward
  for (let j = i - 1; j >= 0; j--) {
    if (lines[j].trim() !== '') break
    strip[j] = true
  }
}
```

- [ ] **2.3:** Run `npm run test -- tests/scripts/extract-en-book/normalize.test.ts` — confirm all tests (including the 2 new ones) pass.

- [ ] **2.4:** Run `npm run test` — full suite, expect 216/216 green.

- [ ] **2.5:** Run `npm run typecheck && npm run lint && npm run format:check`. If format warns on `normalize.ts`, run `npx prettier --write scripts/extract-en-book/normalize.ts`.

- [ ] **2.6:** Write commit message to `.tmp/commit-msg.txt` (overwrite):

```
feat(extract-en-book): page-boundary cleanup — QXD leak + blank propagation

Two small fixes surfaced during N1 calibration, both in normalize.ts:

- #36: widen QXD_HEADER regex to allow leading whitespace, so that
  lines prefixed with form-feed (\x0c, pdftotext's page-break marker)
  get stripped. Previously the ^Alco_ anchor missed them.
- #37: extend Pass-2 to walk forward and backward from each stripped
  line, marking contiguous blank runs as stripped. Previously only the
  immediately-adjacent blank was caught, so 3-4-line blank runs around
  page-break headers left surviving blanks that caused false paragraph
  boundaries.

Closes #36.
Closes #37.
```

Then: `git add scripts/extract-en-book/normalize.ts && git commit -F .tmp/commit-msg.txt`

- [ ] **2.7:** Confirm with `git log --oneline -3` — RED, GREEN, and `b6c2cdd` visible.

**Subagent stop condition:** Stop after Task 2 commit is verified. Do NOT push, do NOT regenerate artifact.

---

## Task 3 (Plantin): artifact refresh

- [ ] **3.1:** `EXTRACTED_AT=2026-04-18T00:00:00Z npm run extract:en 2>&1 | tee .tmp/extract-run.log`

- [ ] **3.2:** Verify acceptance:
  - `grep -c "Alco_.*qxd" data/extractions/en-4th-edition.json` → 0
  - `grep -B1 '^\s*> [a-z]'` in sample-review finds no continuation fragments at page boundaries
  - `ch06-into-action-p025` (or equivalent) no longer starts with `"wouldn't care to have advertised..."`

- [ ] **3.3:** Commit with `chore(extract): refresh EN artifact after page-boundary cleanup`, push branch, FF-merge main when PO approves.
