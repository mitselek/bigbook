# Content bootstrap generator (v1.1-content P1)

**Date:** 2026-04-19
**Status:** Design approved
**Milestone:** `v1.1-content` — phase **P1 (bootstrap generator)**
**Closes:** none directly (P1 is one phase of the milestone; the milestone closes when P4 lands)
**Parents:**

- `2026-04-19-en-et-pairing-artifact-design.md` (P0 — produced the pairing artifact consumed here)
- `2026-04-18-structured-extraction-design.md` (EN extraction baseline)
- `2026-04-18-structured-extraction-et-design.md` (ET extraction baseline)

## Scope

This design covers **phase P1** of the `v1.1-content` milestone: a deterministic generator that consumes the approved pairing artifact plus both extractions and emits a new `src/content/{en,et}/` tree of 68 canonical sections per language, fills asymmetric blocks with machine translations attributed to a new team role (`Boderie`), and regenerates the reader's `CHAPTERS` manifest to match.

**Out of scope for P1:**

- Adapting the reader's components, URL scheme, IDB keys, and TOC layout for the new 68-section shape (phase **P2**).
- Wiring a Hard Invariant pre-commit hook against the new tree (phase **P3**).
- Playwright / E2E test refresh (phase **P4**).
- Re-extraction of the two upstream data gaps flagged at P0 close (a-iv ET source gap; ch01 byline reclassification). Both are already represented correctly in the pairing artifact as of 2026-04-19 and require no P1-side action.

## Goal

Produce, on a feature branch (see D1), a complete `src/content/{en,et}/` tree of 68 markdown files per language plus a regenerated `manifest.json` + compatibility wrapper, such that (a) every paragraph in the artifact has a visible rendered representation in both languages, (b) machine-translated paragraphs are visibly attributed via the existing `(_BB:<Agent>_)` convention, and (c) the reader's existing `CHAPTERS` import continues to resolve without source changes until P2 rewires it deliberately.

The Hard Invariant formalised in P0's spec holds literally in the output: every `para-id` in the EN tree has exactly one matching `para-id` in the ET tree, and vice versa. The only asymmetry is provenance — some paragraphs carry `(_BB:Boderie_)` attribution indicating they are machine-translated seed content awaiting community refinement.

## Input sources

Three committed artifacts, all currently on `main` as of `c2ee691`:

- **Pairing artifact:** `data/extractions/pairing/en-et.json` — 67 paired sections + 1 unpaired (a-pamphlets) · 2,033 paired paraIds · 0 low-confidence · 0 `needs-review` · 2 N:M `accepted-split` pairs.
- **EN extraction:** `data/extractions/structured/en-4th-edition.json` — 68 sections, 2,094 blocks.
- **ET extraction:** `data/extractions/structured-et/et-4th-edition.json` — 67 sections, 2,051 blocks.

Plus a fourth input that P1 produces and then consumes for cache hits on re-runs:

- **Translation cache:** `data/extractions/pairing/translation-cache.json` — keyed by `sha256(sourceText + targetLang + model + promptVersion)`, cached across runs. Committed alongside the content.

## Design decisions

The brainstorm (2026-04-19) produced ten decisions that together define P1. Each is canonical for this phase; downstream phases inherit them unless explicitly revisited.

### D1 — Feature-branch staging with worktree isolation

P1's output replaces the entire `src/content/{en,et}/` tree and regenerates the manifest. Merging P1 into `main` before P2 adapts the reader would break the live site (components assume 16 sections, new URLs don't exist, IDB keys don't migrate). **P1 lands on a feature branch** (`feat/v1.1-content-p1` or similar) via a dedicated git worktree. The branch stays open until P2 catches up; both merge together.

This is a departure from session 12's main-branch pattern but warranted by the scope — a classic feature-branch scenario.

### D2 — `para-id` convention: within-kind ordinals

The P0 review surfaced a mixed-convention debt between extractions (position-in-section ordinals) and the pairing artifact (within-kind ordinals). P1 resolves it: **the canonical `para-id` is the pairing artifact's scheme**, propagated into the markdown and manifest. Within-kind ordinals read naturally in commit messages (`Muuda ch09-p027 (et)` = "paragraph 27 of ch09") and URL fragments.

Extraction-side IDs stay as they are (no backfill migration); the generator bridges them. Future re-extractions should adopt the within-kind convention to retire the duality; P1 does not require that upstream change.

### D3 — Policy C rendering of unpaired blocks, enhanced with auto-translation

For each of the 10 side-only block entries in the artifact, **both sides emit a paragraph at the same `para-id`**, preserving 1:1 pairing. The absent side's content is filled by machine translation attributed to `(_BB:Boderie_)`. The 13 `structural-extra` entries render on neither side (they were editorially dropped during review).

This supersedes the original "placeholder text" plan from Q3 brainstorm with a richer, editable seed. Auto-translated paragraphs are first-class content that community editors refine through the existing editor workflow; a refined paragraph loses the `Boderie` attribution on save (the editor commit's author becomes the attribution).

### D4 — `a-pamphlets` gets auto-translated, not skipped

The single unpaired section in the artifact (`a-pamphlets`, 54 EN-only list-items) is handled the same way as block-level asymmetries: **both sides emit a markdown file**, the ET side's pamphlet titles come from Boderie. This dissolves the "wall of 54 placeholders" problem from Q4 brainstorm — each ET line carries a translated title, differentiated by construction.

The `unpairedSections` field in the artifact no longer has any consumer-visible effect in P1's output; it remains as audit metadata.

### D5 — Attribution via the existing `(_BB:<Agent>_)` convention

The markdown for an auto-translated paragraph carries a trailing attribution line:

```markdown
::para[a-pamphlets-l001]

Alkohoolikute Anonüümide — kolmas pärand (3 õpetust)

(_BB:Boderie_)
```

This piggy-backs on the team's existing roster lore convention (Plantin, Montano, Granjon, Ortelius in commit messages and authored markdown). **Boderie joins the roster as the translator role** — historically Guy Le Fèvre de la Boderie, the French scholar-orientalist hired by Plantin for the Syriac portion of the _Biblia Polyglotta_, documented collaborator of Montano. Period-exact, Antwerp-circle member, narrow-role fit.

The attribution is visible in rendered markdown (italic trailing line, standard markdown convention), survives merges cleanly, is grep-able in the source tree, and integrates with the existing editor flow: any human edit through the editor writes a different attribution (the editor's authenticated GitHub identity), which the reader renders with a different visual treatment per existing UI.

### D6 — Translation backend: Claude Sonnet 4.6, cached

**Backend:** Claude Sonnet 4.6 via `@anthropic-ai/sdk` (already in deps at `^0.89.0`). Sonnet over Haiku for the register-sensitive AA content; cost for ~64 blocks is trivial.

**System prompt (Boderie persona):** the generator constructs a single system prompt that establishes Boderie's role, the AA Big Book register, the preference for proper-name preservation, and the expectation that the model outputs only the translation (no commentary, no disclaimers, no frames). Versioned via `promptVersion` constant; a bump triggers cache misses.

**Determinism:** each call is cached in `data/extractions/pairing/translation-cache.json`, keyed by `sha256(sourceText + targetLang + model + promptVersion)`. Committed alongside content. Re-runs are byte-exact idempotent unless source text, target language, model, or prompt version changes.

**Rate limiting:** sequential calls with retry-on-429 (SDK's built-in). 64 blocks takes under a minute.

**API key:** the generator reads `ANTHROPIC_API_KEY` from env. If unset, P1 fails closed rather than emitting placeholders — the content is either fully seeded or the generator errors out.

### D7 — Cover and index handling

`src/content/{en,et}/cover.md` and `src/content/{en,et}/index.md` are not derived from the extractions (they are reader chrome, not book content). P1 emits them via **static templates**:

- **`cover.md`** per language: hand-crafted title page (book title, edition, language-specific subtitle). Generator writes these on first run and leaves them untouched on re-runs (idempotence protection via a marker comment).
- **`index.md`** per language: auto-generated TOC listing all 68 canonical sections grouped by `group`, each row a link to the section's reader URL. Regenerated every run to match the current manifest.

Both live outside the canonical slug table (they are not `SectionMapEntry` rows) and are not paired by the pairing artifact.

### D8 — Group mapping for TOC

The `group` frontmatter field on each section takes one of five values:

| Group           | Canonical slugs                                             |
| --------------- | ----------------------------------------------------------- |
| `front-matter`  | `copyright`, `preface`, `fw1`, `fw2`, `fw3`, `fw4`, `arsti` |
| `chapters`      | `ch01` through `ch11`                                       |
| `stories`       | `s01` through `s42`                                         |
| `appendices`    | `a-i` through `a-vii`, `a-pamphlets`                        |
| `reader-chrome` | `cover`, `index`                                            |

Hardcoded in `scripts/bootstrap-content/groups.ts` alongside the section-map table (reused via import from `scripts/pair-en-et/section-map.ts`).

### D9 — Manifest location: co-located with content, plus backward-compat wrapper

**New authoritative manifest:** `src/content/manifest.json` — a generated JSON file listing all 68 canonical sections + their group + per-section paraIds + pdfPageStart/End. Co-located with the content it indexes (per PO suggestion during brainstorm).

**Backward-compat wrapper:** the existing `src/lib/content/manifest.ts` gets regenerated as a thin re-export that imports `src/content/manifest.json` and exposes the same `CHAPTERS` shape the reader's components currently import. This lets P1 land without forcing P2-scoped changes to 8 components.

P2 decides whether to migrate the reader to import from `src/content/manifest.json` directly and retire the wrapper.

### D10 — Markdown block rendering per kind

The generator maps each `BlockKind` to a markdown form. All blocks emit as a `::para[<para-id>]` directive followed by the block content:

| Kind         | Markdown form                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `heading`    | `#`/`##`/`###` based on section context — first heading in a section is `#`, subsequent are `##`/`###` by relative depth. Paired pair uses single heading per side.                         |
| `paragraph`  | Plain prose.                                                                                                                                                                                |
| `list-item`  | `-` bullet. Consecutive list-items in a section produce a continuous list.                                                                                                                  |
| `blockquote` | `> ` prefix on each line.                                                                                                                                                                   |
| `verse`      | Hard-line-break prose: preserve source line breaks with two-space line endings. Single block, no special markdown syntax.                                                                   |
| `table`      | Markdown table (pipes + separator row). Only emitted if `structural-extra` drops the block; so in practice no tables ship in P1 output. Generator handles the kind generically.             |
| `byline`     | Italicized trailing line: `*<text>*`.                                                                                                                                                       |
| `footnote`   | Rendered as its own `::para[id]` with the text italicized; rendered at the natural position in the section (footnotes have ordinals within-kind; the reader decides rendering later in P2). |

Every block emits its source text exactly as captured in the extraction (for paired blocks), or exactly the model's output (for translated blocks). No rewriting, no normalization.

## Architecture

### Directory layout

```
scripts/bootstrap-content/
├── bootstrap.ts          # CLI entry — orchestrates the full pipeline
├── groups.ts             # canonical-slug → group mapping (+ reader-chrome entries)
├── boderie.ts            # Claude API wrapper + Boderie persona + translation cache
├── emit-markdown.ts      # per-section markdown renderer (blocks → .md)
├── emit-manifest.ts      # manifest.json generator
├── emit-wrapper.ts       # src/lib/content/manifest.ts compat wrapper generator
├── static-templates.ts   # cover.md templates (+ idempotence logic)
├── types.ts              # ManifestSection, BoderieCall, BoderieCacheEntry
└── index.ts              # barrel for tests

tests/scripts/bootstrap-content/
├── groups.test.ts
├── boderie.test.ts       # cache-key determinism, prompt formatting; Claude API stubbed
├── emit-markdown.test.ts # per-kind rendering fixtures
├── emit-manifest.test.ts
├── emit-wrapper.test.ts
├── static-templates.test.ts
└── integration.test.ts   # end-to-end on the real artifact + cached translations

src/content/                    # generator output (committed)
├── manifest.json               # NEW — authoritative manifest
├── en/
│   ├── cover.md                # static template (not regenerated post-first-run)
│   ├── index.md                # regenerated every run from manifest
│   ├── copyright.md … a-pamphlets.md  # 68 canonical-slug files
└── et/
    └── ... (symmetric)

src/lib/content/
└── manifest.ts                 # regenerated compat wrapper (re-exports manifest.json)

data/extractions/pairing/
└── translation-cache.json      # NEW — committed Boderie cache
```

### CLI entry points

Added to `package.json`:

| Command                            | Purpose                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run bootstrap`                | Full run: load artifact + extractions + cache → translate missing blocks (fill cache) → emit content tree + manifest. Errors if `ANTHROPIC_API_KEY` unset and cache lacks needed entries. Requires `CONTENT_BOOTSTRAP=1` env to bypass the content-guard pre-commit hook. |
| `npm run bootstrap:translate-only` | Populate translation cache only (no markdown emission). Useful for PO review of machine translations before they land in content.                                                                                                                                         |
| `npm run bootstrap:emit-only`      | Emit markdown + manifest from current cache (no Claude calls). Useful for iterating on rendering code without re-translating.                                                                                                                                             |

### Dependency between phases of a run

```
             ┌──────────────────┐
             │ load artifact +  │
             │ extractions +    │
             │ cache            │
             └────────┬─────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         v                         v
  ┌──────────────┐         ┌──────────────┐
  │ identify     │         │ compute per- │
  │ blocks       │         │ section      │
  │ needing      │         │ rendering    │
  │ translation  │         │ plan         │
  └──────┬───────┘         └───────┬──────┘
         │                         │
         v                         │
  ┌──────────────┐                 │
  │ Boderie      │                 │
  │ translate +  │                 │
  │ update cache │                 │
  └──────┬───────┘                 │
         │                         │
         └─────────────┬───────────┘
                       │
                       v
              ┌────────────────┐
              │ emit 68×2 md + │
              │ manifest + lib │
              │ wrapper +      │
              │ cover + index  │
              └────────────────┘
```

### Boderie translation wrapper

```ts
// types.ts
export interface BoderieCacheEntry {
  sourceText: string
  targetLang: 'en' | 'et'
  model: string
  promptVersion: string
  translation: string
  calledAt: string // ISO
  usage: { inputTokens: number; outputTokens: number }
}

export type BoderieCache = Record<string, BoderieCacheEntry> // key = sha256

// boderie.ts (shape)
export async function translate(
  sourceText: string,
  opts: { targetLang: 'en' | 'et'; cache: BoderieCache },
): Promise<{ translation: string; cacheHit: boolean }>
```

**System prompt (v1, stored as `PROMPT_VERSION = '1.0'`):**

```
You are Boderie, a scholar-translator in the Officina Plantiniana tradition.
You translate Alcoholics Anonymous "Big Book" text between English and Estonian,
preserving the register, tone, and subtle spiritual inflection of the original.
You produce clean, idiomatic prose in the target language.

Rules:
- Output ONLY the translation. No commentary, disclaimers, or framing phrases.
- Preserve proper names (Bill W., Dr. Bob, Akron) unless a well-established
  local convention exists (e.g. "Anonüümsed Alkohoolikud" for "Alcoholics Anonymous").
- For short list-item titles (pamphlet names etc.), keep the translation tight.
- For spiritual/recovery-program language, match the register of the existing
  translated chapters — sober, plain, first-person-plural.
- Keep line breaks only when the source has them.
```

User prompt template:

```
Translate the following {sourceLang} text to {targetLang}:

{sourceText}
```

Model: `claude-sonnet-4-6` (alias; SDK resolves to the concrete version).

## Schemas

### Section frontmatter (per `.md` file)

```yaml
---
chapter: ch01 # canonical slug
title: "Bill's Story" # language-specific, from extraction title field or static override
lang: en # or et
group: chapters # front-matter | chapters | stories | appendices | reader-chrome
pdfPageStart: 22 # source PDF provenance
pdfPageEnd: 37
---
```

The `pairedSide` field from the original P1 sketch is **not used** — auto-translation removes the need for side-only section markers at the file level.

### `src/content/manifest.json`

```json
{
  "version": "1.1",
  "generatedAt": "2026-04-19T00:00:00Z",
  "sections": [
    {
      "canonicalSlug": "copyright",
      "group": "front-matter",
      "title": { "en": "Copyright", "et": "Autoriõigused" },
      "paraIds": ["copyright-p001", "copyright-p002", "..."],
      "pdfPageStart": 1,
      "pdfPageEnd": 1
    },
    { "canonicalSlug": "preface", ... },
    ...
  ]
}
```

68 entries in book order (copyright → preface → fw1..fw4 → arsti → ch01..ch11 → s01..s42 → a-i..a-pamphlets). The `reader-chrome` entries (`cover`, `index`) live in a separate top-level array or are omitted from `sections` entirely (decision: omit — they are not book content and don't need manifest entries; the reader hardcodes their routes in P2).

### `src/lib/content/manifest.ts` (compat wrapper)

```ts
// Generated by scripts/bootstrap-content/emit-wrapper.ts — do not edit by hand.
// Regenerate with: CONTENT_BOOTSTRAP=1 npm run bootstrap

import manifest from '../../content/manifest.json'

export type ChapterManifest = {
  slug: string
  title: { en: string; et: string }
  paraIds: readonly string[]
}

export const ESTIMATED_HEIGHT_TITLE = 60
export const ESTIMATED_HEIGHT_BODY = 110

export const CHAPTERS: readonly ChapterManifest[] = manifest.sections.map((s) => ({
  slug: s.canonicalSlug,
  title: s.title,
  paraIds: s.paraIds,
}))
```

Shape-identical to the current `CHAPTERS` export; the reader's 8 importing components need no source change in P1. P2 may migrate off the wrapper.

## Testing strategy

- **Unit (vitest)** per module in `scripts/bootstrap-content/`:
  - `groups.test.ts` — table round-trips: every canonical slug maps to its expected group.
  - `emit-markdown.test.ts` — per-kind rendering golden tests for each `BlockKind`. Separate fixtures for paired vs auto-translated vs N:M vs static-template.
  - `emit-manifest.test.ts` — snapshot against a tiny artifact fixture.
  - `emit-wrapper.test.ts` — ensure wrapper's `CHAPTERS` export matches current `ChapterManifest` shape exactly.
  - `static-templates.test.ts` — cover template emission + idempotence marker behaviour.
  - `boderie.test.ts` — cache-key determinism (same input → same hash); prompt construction; Claude API stubbed via `@anthropic-ai/sdk`'s built-in testing interface or a manual `fetch` mock.
- **Integration (vitest)** — end-to-end on a tiny artifact fixture (two sections, one needing translation) with a stubbed Boderie. Asserts the complete output tree matches a committed golden directory.
- **Coverage** — `scripts/bootstrap-content/` held to the same bar as `scripts/pair-en-et/` (≥ 90% lines/functions/statements, ≥ 85% branches). Pre-existing coverage include extends to cover the new directory.
- **No Playwright** for P1 — it is a CLI, not a web surface.

## Author attribution and team roster change

P1 introduces a new team role: **Boderie**. Updates required:

- **`.claude/teams/bigbook-dev/roster.json`** — add Boderie as a `general-purpose` agent with `sonnet` model, with lore block covering Guy Le Fèvre de la Boderie's Biblia Polyglotta contributions. Dispatched as a one-shot (no persistent scratchpad — the cache file is his memory).
- **`.claude/teams/bigbook-dev/prompts/boderie.md`** — the persona prompt (system prompt content) stored here for reference and version control. The generator imports its prompt text at build time.
- **`.claude/teams/bigbook-dev/common-prompt.md`** — attribution table extends: `(_BB:Boderie_)` applies to auto-translated blocks in `.md` output and to any `translation-cache.json` entries he produced.

P1 implementation itself runs through the normal XP triple: Plantin decomposes → Montano tests → Granjon implements → Ortelius refactors. Boderie runs at generator execution time, not during implementation.

## Open questions

Two items remain and should be resolved before the P1 implementation plan executes. Neither re-opens the design.

### O1 — Cover template content

The hand-crafted `cover.md` per language needs title-page copy (book name, edition, subtitle). This is a content decision, not a generator-engineering one. Default placeholders:

- `en/cover.md`: `# Alcoholics Anonymous` · `### The Story of How Many Thousands of Men and Women Have Recovered from Alcoholism` · `Fourth Edition`
- `et/cover.md`: `# Anonüümsed Alkohoolikud` · `### Lugu sellest, kuidas mitu tuhat meest ja naist on alkoholismist vabanenud` · `Neljas väljaanne`

PO to approve or supply alternatives before P1 execution.

### O2 — Boderie prompt-language sensitivity

The system prompt as drafted (§Boderie translation wrapper) is written in English but guides translation in both directions. An alternative is to compose the system prompt in the target language when the direction is EN→ET (so the model stays "in Estonian" throughout its context). This is a translation-quality experiment, not a correctness question. Default: single English system prompt; revisit if Q1 spot-checks show noticeable quality drift on ET output.

## Next steps

1. PO reviews and approves this spec.
2. Invoke `writing-plans` skill against this spec to produce the P1 implementation plan.
3. Create feature branch `feat/v1.1-content-p1` via worktree.
4. Execute the plan through the XP triple on the feature branch.
5. Post-implementation: PO reviews a full `npm run bootstrap` output (136 files + manifest + ~64 Boderie translations) before any merge.
6. When P2 (reader adaptation) completes on a parallel feature branch, both merge into main together.
7. Open brainstorm for P2 (reader adaptation).

(_BB:Plantin_)
