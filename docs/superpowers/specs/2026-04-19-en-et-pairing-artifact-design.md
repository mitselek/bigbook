# EN/ET para-id pairing artifact (issue #39)

**Date:** 2026-04-19
**Status:** Design approved
**Closes:** issue #39 (para-id pairing between EN and ET structured extractions)
**Parents:**

- `2026-04-18-structured-extraction-design.md` (EN baseline)
- `2026-04-18-structured-extraction-et-design.md` (ET baseline)

**Milestone:** `v1.1-content` (new; tracks the content-backfill work that closes when `src/content/{en,et}/` carries PDF-derived bilingual content under the Hard Invariant).

## Scope

This design covers **phase P0** of the `v1.1-content` milestone: production of a bidirectional para-id pairing artifact between the EN and ET structured extractions. Downstream phases (bootstrap generator, reader adaptation, Hard Invariant enforcement, Playwright suite refresh) exist as milestone-level work items but get their own brainstorms and plans when P0 closes.

**Out of scope for P0:**

- Generating the new `src/content/{en,et}/` tree (phase P1).
- Adapting the reader to the expanded section list (phase P2).
- Wiring the Hard Invariant check into pre-commit (phase P3).
- Refreshing Playwright E2E tests (phase P4).

## Goal

Produce `data/extractions/pairing/en-et.json` — the machine-readable mapping between EN extraction blocks and ET extraction blocks — plus `data/extractions/pairing/review.md`, a human-readable report of any case the deterministic pairer could not resolve with high confidence.

The Hard Invariant from the original product spec is: _every para-id paired exactly once across EN/ET, unless explicitly marked EN-only or ET-only with a reason_. The pairing artifact is the authoritative expression of that invariant. Downstream phases consume it; this phase produces it.

## Source data

Both structured extractions are on `main`:

- **EN:** `data/extractions/structured/en-4th-edition.json` — **68 sections**, 2,094 blocks.
- **ET:** `data/extractions/structured-et/et-4th-edition.json` — **67 sections**, 2,065 blocks.

Section breakdown (identical categories both sides):

| Kind                     |     EN |     ET |
| ------------------------ | -----: | -----: |
| front-matter (copyright) |      1 |      1 |
| preface                  |      1 |      1 |
| foreword                 |      4 |      4 |
| doctor's opinion         |      1 |      1 |
| chapter                  |     11 |     11 |
| story                    |     42 |     42 |
| appendix                 |  **8** |  **7** |
| **total**                | **68** | **67** |

The single section asymmetry is the `appendix-aa-pamphlets` appendix (49 EN list-items enumerating AA's pamphlet inventory; never translated).

Both extractions share the `BookSection` schema: `{id, kind, title, pdfPageStart, pdfPageEnd, bookPageStart, bookPageEnd, blocks[]}` where each block is `{id, kind, text, pdfPage}` and block `kind ∈ {paragraph, heading, list-item, blockquote, byline, footnote}`.

## Design decisions (from brainstorm)

The brainstorm produced eight decisions. Each is canonical for P0 and downstream phases inherit them.

### D1 — Method: deterministic-first, human-reviewed where it breaks

The pairer is a pure-TypeScript script that uses structural signals (section mapping, block kind, within-section ordinal position, text-length ratio) to propose pairs. High-confidence pairs auto-commit. Low-confidence pairs and unpaired blocks surface in `review.md` for PO resolution. **No LLM is in the deterministic path.** LLM (Opus) assistance is available to the PO during manual review of `review.md`, but never drives the committed artifact directly.

### D2 — The pairing artifact is the source of truth for a `CONTENT_BOOTSTRAP=1` rebuild

The artifact is not merely analytical. Downstream phase P1 consumes it to regenerate `src/content/{en,et}/`. Every EN block must therefore be resolved to one of: paired, intentionally EN-only, or intentionally-extracted-and-dropped. No "unknown" tier is allowed in the final artifact.

### D3 — Structural mismatches handled case-by-case with a permissive schema

The schema supports unpaired blocks (EN-only, ET-only), unpaired sections (EN-only, ET-only), and N:M pairs — but aims for strict 1:1. The six known mismatch cases from issue #39 are resolved as follows:

| #   | Case                                          | Disposition                                                                                                                                                                                 |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | EN `appendix-aa-pamphlets` (49 list-items)    | `section-en-only` — preserved in artifact as an unpaired section for future translation work.                                                                                               |
| 2   | ET `copyright-info` +5 table blocks           | Drop (scanner noise / TOC duplication). `UnpairedBlock { reason: "structural-extra" }` in artifact.                                                                                         |
| 3   | ET `ch11` +15 blocks                          | **Stale claim** — current state is +1 paragraph after later ET extraction waves. Treat as a normal near-parity section.                                                                     |
| 4   | ET `appendix-i-aa-traditsioonid` +1 LISAD TOC | Drop. `UnpairedBlock { reason: "structural-extra" }`.                                                                                                                                       |
| 5   | ET `eessona-1st` extra byline                 | Keep as `et-only` — real content.                                                                                                                                                           |
| 6   | Story: ET 11 blockquotes vs EN 12             | Re-segment the ET extraction output (split ET's merged blockquote at the period-before-parenthesis), restoring 1:1. Editorial re-segmentation is lower cost than the schema-level N:M path. |

**N:M in the schema is dormant by default** — it exists as a legal state so review can accept a collapse without a schema migration, but the pairing goal is always strict 1:1 and the review workflow prefers extraction-output edits over schema-level N:M acceptance.

### D4 — Synthesized bilingual `para-id`

The artifact assigns a canonical, language-neutral `para-id` to every pair. Format: `<canonical-section-slug>-<kind-prefix><NNN>` where kind-prefix mirrors the extraction convention (`p` paragraph · `h` heading · `l` list-item · `q` blockquote · `b` byline · `f` footnote). Examples: `ch01-p007`, `s03-q011`, `a-i-l023`, `fw2-h001`.

### D5 — Review workflow: JSON + markdown report, edit JSON in-place

The pairer emits two files:

- `data/extractions/pairing/en-et.json` — machine-read, the artifact.
- `data/extractions/pairing/review.md` — human-read, reports every section containing any non-high pair.

The PO reviews `review.md`, edits `en-et.json` by hand (may consult Opus), and runs `npm run pair:verify` to re-validate against the extractions. `review.md` regenerates from the verified JSON. Iterate until `review.md` reports zero low-confidence pairs and zero unresolved `needs-review` entries.

### D6 — No user-edit preservation across the bootstrap

The single production edit against mock content (`6f17bb2 Muuda ch09-perekond-hiljem-p027 (et)`) is discarded. The mock tree is being replaced wholesale; the edit was a system-test artifact rather than authoritative content.

### D7 — Reader shape: one file per extraction section (~136 files total)

Downstream P1 emits one markdown file per canonical section per language. Current bundled files (`eessonad.md`, `lisad.md`) are replaced by per-section files. Decision affects P1–P4 planning but does not change P0 output.

### D8 — Milestone-level phasing (reference only; P1–P4 are separate brainstorms)

| Phase  | Deliverable                                         | Gate                                |
| ------ | --------------------------------------------------- | ----------------------------------- |
| **P0** | Pairing artifact + review CLI + tests               | This spec. `review.md` is empty.    |
| P1     | Bootstrap generator, rebuilt `src/content/{en,et}/` | Separate brainstorm when P0 closes. |
| P2     | Reader adaptation (TOC, URLs, IDB)                  | Separate brainstorm when P1 closes. |
| P3     | Hard Invariant pre-commit hook                      | Separate brainstorm when P2 closes. |
| P4     | Playwright E2E refresh                              | Separate brainstorm when P3 closes. |

## Canonical slug table

68 entries total. Hardcoded in `scripts/pair-en-et/section-map.ts`, reviewed as a code artifact (not heuristically inferred).

|     # | Canonical slug | EN section id                             | ET section id                             |
| ----: | -------------- | ----------------------------------------- | ----------------------------------------- |
|     1 | `copyright`    | `copyright-info`                          | `copyright-info`                          |
|     2 | `preface`      | `preface`                                 | `eessona`                                 |
|     3 | `fw1`          | `foreword-1st-edition`                    | `eessona-1st`                             |
|     4 | `fw2`          | `foreword-2nd-edition`                    | `eessona-2nd`                             |
|     5 | `fw3`          | `foreword-3rd-edition`                    | `eessona-3rd`                             |
|     6 | `fw4`          | `foreword-4th-edition`                    | `eessona-4th`                             |
|     7 | `arsti`        | `doctors-opinion`                         | `arsti-arvamus`                           |
|     8 | `ch01`         | `ch01-bills-story`                        | `ch01-billi-lugu`                         |
|     9 | `ch02`         | `ch02-there-is-a-solution`                | `ch02-lahendus-on-olemas`                 |
|    10 | `ch03`         | `ch03-more-about-alcoholism`              | `ch03-alkoholismist-lahemalt`             |
|    11 | `ch04`         | `ch04-we-agnostics`                       | `ch04-meie-agnostikud`                    |
|    12 | `ch05`         | `ch05-how-it-works`                       | `ch05-kuidas-see-toetab`                  |
|    13 | `ch06`         | `ch06-into-action`                        | `ch06-tegutsema`                          |
|    14 | `ch07`         | `ch07-working-with-others`                | `ch07-too-teistega`                       |
|    15 | `ch08`         | `ch08-to-wives`                           | `ch08-naistele`                           |
|    16 | `ch09`         | `ch09-the-family-afterward`               | `ch09-perekond-hiljem`                    |
|    17 | `ch10`         | `ch10-to-employers`                       | `ch10-tooandjatele`                       |
|    18 | `ch11`         | `ch11-a-vision-for-you`                   | `ch11-tulevikupilt-teie-jaoks`            |
| 19–60 | `s01` … `s42`  | stories in EN book order (pp. 186–565)    | stories matched by book order             |
|    61 | `a-i`          | `appendix-i-the-aa-tradition`             | `appendix-i-aa-traditsioonid`             |
|    62 | `a-ii`         | `appendix-ii-spiritual-experience`        | `appendix-ii-vaimne-kogemus`              |
|    63 | `a-iii`        | `appendix-iii-the-medical-view-on-aa`     | `appendix-iii-meditsiiniline-vaade-aa-le` |
|    64 | `a-iv`         | `appendix-iv-the-lasker-award`            | `appendix-iv-lasker-award`                |
|    65 | `a-v`          | `appendix-v-the-religious-view-on-aa`     | `appendix-v-religioosne-vaade-aa-le`      |
|    66 | `a-vi`         | `appendix-vi-how-to-get-in-touch-with-aa` | `appendix-vi-kuidas-aaga-uhendust-votta`  |
|    67 | `a-vii`        | `appendix-vii-the-twelve-concepts`        | `appendix-vii-kaksteist-kontseptsiooni`   |
|    68 | `a-pamphlets`  | `appendix-aa-pamphlets`                   | _(none — EN-only)_                        |

The full `s01`–`s42` row expansion is written out in `section-map.ts` and exercised by `section-map.test.ts`.

## Artifact schema

Conceptual TypeScript types. Canonical form in `scripts/pair-en-et/types.ts`.

```ts
interface PairingArtifact {
  version: '1.0'
  generatedAt: string // ISO-8601
  sourceEn: { path: string; sha256: string; blockCount: number }
  sourceEt: { path: string; sha256: string; blockCount: number }
  sections: SectionPair[]
  unpairedSections: UnpairedSection[]
}

interface SectionPair {
  canonicalSlug: string // "ch01", "s03", "a-i", ...
  enSectionId: string // "ch01-bills-story"
  etSectionId: string // "ch01-billi-lugu"
  pairs: Pair[]
  unpaired: UnpairedBlock[]
  diagnostics: string[] // free-form audit notes, rendered in review.md
}

interface UnpairedSection {
  side: 'en' | 'et'
  sectionId: string // raw extraction ID
  canonicalSlug: string
  reason: 'section-en-only' | 'section-et-only'
  blockCount: number
}

interface Pair {
  paraId: string // synthesized, e.g. "ch01-p007"
  kind: BlockKind
  enBlockId: string | string[] // N:M support; strict 1:1 is the goal
  etBlockId: string | string[]
  confidence: 'high' | 'low'
  notes?: string // e.g. "length-ratio 1.8", "2→1 collapse"
}

interface UnpairedBlock {
  blockId: string
  side: 'en' | 'et'
  kind: BlockKind
  reason: 'structural-extra' | 'section-en-only' | 'section-et-only' | 'needs-review'
  notes?: string
}

type BlockKind = 'paragraph' | 'heading' | 'list-item' | 'blockquote' | 'byline' | 'footnote'
```

### Invariants (enforced by `verify.ts`)

1. Every EN block ID in the extraction appears **exactly once** across all `pairs[].enBlockId` (including array entries), `unpaired[side=en]`, and `unpairedSections[side=en]`. Same for ET. No block may be referenced twice; no block may be omitted.
2. Every `paraId` is unique across the artifact.
3. Every `confidence: "low"` pair must appear in `review.md`.
4. `pairs[].kind` must equal both the EN and ET block's `kind` — no cross-kind pairing is ever auto-emitted. Human edits may introduce cross-kind pairs only by setting `confidence: "low"` with an explanatory `notes`.
5. N:M pairs (where either `enBlockId` or `etBlockId` is an array of length > 1) require `confidence: "low"` unless `notes` contains an explicit justification phrase (`"accepted-collapse"` or `"accepted-split"`).

## Pairing algorithm

The pairer is intentionally dumb and auditable. It maximizes obvious cases and hands everything else to review.

### Stage 1 — Section pairing

Iterate the canonical slug table. For each slug:

- Both sides present → emit `SectionPair` and proceed to Stage 2 for that section.
- Only EN present → emit `UnpairedSection { side: "en" }` and skip Stage 2.
- Only ET present → emit `UnpairedSection { side: "et" }` and skip Stage 2.

### Stage 2 — Block pairing within a paired section

**Step A — Group both sides by block kind, preserving order.**

```
enByKind = groupBy(enBlocks, b => b.kind)
etByKind = groupBy(etBlocks, b => b.kind)
```

**Step B — For each kind used by the section, compare counts.**

- `enByKind[k].length === etByKind[k].length` → position-anchored pairing. Each pair assigned:
  - `paraId` = `<canonicalSlug>-<kindPrefix><NNN>` where NNN is 1-indexed position within the kind.
  - `confidence: "high"` by default.
  - **Length-ratio guard:** `r = len(etText) / len(enText)`. If `r ∈ [0.55, 1.6]`, keep `confidence: "high"`. If outside the band, downgrade to `confidence: "low"` and set `notes: "length-ratio ${r.toFixed(2)}"`.
- `enByKind[k].length !== etByKind[k].length` → **no auto-alignment**. Emit every block of that kind on both sides as `UnpairedBlock { reason: "needs-review" }`, annotate `diagnostics` with `"kind-count mismatch: ${k} en=${n} et=${m}"`.

**Step C — Never pair across kinds.** Cross-kind candidates (paragraph ↔ blockquote, etc.) are never auto-emitted; the PO introduces them manually during review only when justified.

### Stage 3 — review.md generation

Render every section with any non-high entry. Omit sections that are all-high (signal only noise).

```markdown
## ch11 — a vision for you ↔ tulevikupilt teie jaoks

**Status:** 1 low-confidence pair · 0 unpaired

### Low-confidence pairs

- **ch11-p047** (paragraph) — length-ratio 1.82
  - EN `ch11-a-vision-for-you-p047`: "Right now, this house can barely hold its weekly visitors..."
  - ET `ch11-tulevikupilt-teie-jaoks-p047`: "Praegu suudaks see maja küll vaevalt oma iganädalasi külalisi..."
```

### What the algorithm deliberately does not do

- **No N:M auto-detection.** Case-6-style collapses surface as a kind-count mismatch; PO decides between editing the extraction or accepting a flagged N:M pair.
- **No fuzzy-match rescue.** If a kind has 11 vs 12 in a section, all 11+12 blocks go to `needs-review`. The PO has the authoritative text; the script does not try to guess.
- **No LLM.** Deterministic throughout.

### Expected signal-to-noise ratio

Eyeball estimate based on current extraction parity: ~95% of sections have per-kind counts that match exactly. The remaining ~5% (plus the six known structural cases from D3) surface in `review.md` — roughly **3–4 sections of genuine review work** per pairing run.

## Implementation shape

### Directory layout

```
scripts/pair-en-et/
├── pair.ts              # CLI entry — loads extractions, runs pipeline, writes outputs
├── section-map.ts       # canonical slug table (68 entries)
├── section-pair.ts      # Stage 1 — SectionPair[] + UnpairedSection[]
├── block-pair.ts        # Stage 2 — per-section kind-grouped pairing
├── confidence.ts        # length-ratio band + confidence tagging
├── review-report.ts     # Stage 3 — renders review.md
├── verify.ts            # invariant validator
├── types.ts             # PairingArtifact, Pair, UnpairedBlock, ...
└── index.ts             # barrel for tests

tests/scripts/pair-en-et/
├── section-map.test.ts
├── section-pair.test.ts
├── block-pair.test.ts
├── confidence.test.ts
├── review-report.test.ts
├── verify.test.ts
└── integration.test.ts   # golden-fixture two-section round-trip

data/extractions/pairing/
├── en-et.json            # the artifact
└── review.md             # regenerated on each run, committed
```

### CLI entry points

| Command               | Purpose                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run pair`        | Full run: load extractions → Stage 1 → Stage 2 → write `en-et.json` + `review.md`. Overwrites. Post-runs `verify`; fails if invariants violated. |
| `npm run pair:verify` | Validate the current committed `en-et.json` against the extractions. Exits non-zero on violation with a per-invariant report.                    |
| `npm run pair:review` | Regenerate `review.md` from the current `en-et.json` without re-pairing. Used after PO hand-edits the JSON.                                      |

### Layer boundaries

All pairing code lives in `scripts/pair-en-et/`. It never imports from `src/`. It consumes only `data/extractions/structured/*.json` and `data/extractions/structured-et/*.json`. Enforced by the existing scripts-directory ESLint rules plus a new `no-restricted-imports` entry denying `src/*` from `scripts/pair-en-et/`.

### Testing strategy

- **Unit (vitest)** per module:
  - `section-map.test.ts` — table round-trips: every EN section ID resolves to the expected slug; every ET section ID likewise; each slug resolves to the expected pair or unpaired-side.
  - `confidence.test.ts` — length-ratio boundary tests at 0.55, 1.6, clearly-in-band, clearly-out-of-band, zero-length edge cases.
  - `block-pair.test.ts` — golden per-section scenarios: equal counts all kinds, kind-count mismatch in one kind, empty section, single-block section, all-kinds-present section.
  - `section-pair.test.ts` — pair/unpaired section resolution, stubbed extraction inputs.
  - `review-report.test.ts` — snapshot test of rendered markdown for a mixed-status artifact.
  - `verify.test.ts` — start from a valid artifact, mutate one field per invariant, assert `verify` rejects with the specific error code.
- **Integration (vitest)**: a compact golden fixture (two fake sections with known structure) runs the full `pair.ts` pipeline and the output artifact is asserted against a committed expected JSON. Fixtures at `tests/scripts/pair-en-et/fixtures/`.
- **No E2E / Playwright** for P0 — it is a CLI, not a web surface.
- **Coverage**: `scripts/pair-en-et/` held to the `src/lib/` bar (≥ 90% lines/functions/statements, ≥ 85% branches). CI `quality` job extends to cover the new directory.

### XP pipeline and attribution

P0 implementation runs through the full triple (Plantin decomposes → Montano writes tests → Granjon implements → Ortelius refactors). Every commit body carries `(*BB:<Role>*)` attribution. `data/extractions/pairing/review.md` carries Plantin attribution; `en-et.json` does not (machine-generated output).

## Open questions

Three items must be resolved before P0 implementation starts. Each is tractable; none re-open the design.

### O1 — CI is failing, blocks P0 verification

The current `main` CI run fails because `poppler-utils` is not installed on the runner; `pdftotext.test.ts` and `pipeline.test.ts` (both in the extraction pipeline from earlier sessions) fail with `pdftotext failed (exit null)`. Orthogonal to P0, but P0 cannot land green until CI is fixed. Resolution: install `poppler-utils` via `apt-get` in the `build-and-deploy.yml` workflow's setup step. **To land as a pre-P0 chore, not inside P0.**

### O2 — Issue #38 (EN heading detection)

11 EN sections have heading-detection failures (multi-line titles, abbreviations, outline typo). Pairing operates on blocks, not titles, so the failures are structurally orthogonal. But `review.md` titles its sections by extraction title, and wrong/missing titles degrade the PO review experience. **Recommendation:** fix #38 before the pairing run so `review.md` is readable. Scope is small (≤ 2 days).

### O3 — Story canonical-slug mapping (`s01`–`s42`)

The section-map table above lists the chapter and appendix slugs concretely but collapses the 42 stories into `s01` … `s42`. The explicit mapping — each `sNN` ↔ EN story ID ↔ ET story ID — must be hand-curated in `section-map.ts`. Book-order is the canonical sequence (per page ranges in both extractions). This is a table-entry task rather than a design question, but wants verification during P0 kickoff that book-order on both sides matches.

## Next steps

1. PO reviews and approves this spec.
2. Resolve O1 (CI fix) and O2 (issue #38) as pre-P0 chores.
3. Invoke `writing-plans` skill against this spec to produce the P0 implementation plan.
4. Execute the plan through the XP triple.
5. PO review of first `review.md` output; iterate edits to `en-et.json` until review.md is empty.
6. Close issue #39. Open brainstorm for P1 (bootstrap generator).

## Known design debt (post-Task-14)

### Block-ordinal numbering convention clash

Two different numbering schemes coexist in the data pipeline and the PO has registered this as **poor design** that should be reconciled, not left to chance:

- **Extraction block IDs** (in `data/extractions/structured/*.json` and `.../structured-et/*.json`) use _position-in-section_ ordinals regardless of kind. First block = `h001` (heading), second block = `p002` (paragraph — `p001` is skipped because the heading consumed that slot), third = `p003`, etc.
- **Pairing artifact `paraId`s** (synthesized by `scripts/pair-en-et/block-pair.ts`) use _within-kind_ ordinals. First heading = `h001`, first paragraph = `p001`, second paragraph = `p002`, etc.

This means a pair like `{paraId: "fw1-p001", enBlockId: "foreword-1st-edition-p002", etBlockId: "eessona-1st-p002"}` is correct in both schemes simultaneously, but reads as a numbering mismatch to anyone not initiated.

**PO position (2026-04-19):** the mixed state is accidental ("happens to land by chance"), not designed. A future cleanup should pick one convention and apply it consistently across extractions, pairing artifact, and the eventual `src/content/{en,et}/` markdown. Decision deferred until P1 brainstorm, where the rebuild target's `para-id` scheme gets re-evaluated holistically.

**Options to revisit at P1:**

1. Align pairing to within-kind (current pairing behaviour) and re-number extractions on next re-run.
2. Align everything to position-in-section and renumber the pairing artifact's `paraId`s to match.
3. Keep both but document the clash prominently (current state — explicitly sub-optimal per PO).

(_BB:Plantin_)
