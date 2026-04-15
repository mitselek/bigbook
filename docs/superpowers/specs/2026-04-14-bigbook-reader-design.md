# BigBook Reader — Product & Engineering Design

- **Status:** Draft, awaiting PO approval of the written spec
- **Date:** 2026-04-14
- **Author:** Plantin (team-lead, bigbook-dev)
- **Supersedes:** The "product brainstorm" ask from the session 2 scratchpad

## 1. Positioning

The bigbook reader is a quiet, book-like bilingual side-by-side web reader of the AA Big Book (_Anonüümsed Alkohoolikud_, 4th edition) in English and Estonian. Anonymous visitors read; signed-in contributors improve the Estonian text through inline edits that commit directly to `main` via the GitHub Contents API. It is **reader-first** — the reader experience is never compromised to serve the contributor experience. It deploys to `https://mitselek.github.io/bigbook/` alongside the frozen legacy Jekyll archive at `/bigbook/legacy/`, sharing one git history through the coexistence inversion landed in session 2.

### 1.1 What the product is not

It is not a translation workbench, a PDF viewer, a discussion forum, or a search engine. Editing and discussion are subordinate affordances; the gravity is reading.

### 1.2 Audience

Two kinds of user:

- **Anonymous readers** — the majority, the whole reason the site exists. Read-only.
- **Signed-in contributors** — a small maintenance crew. Edit Estonian paragraphs and (from v2 onward) leave comments.

### 1.3 Phasing

| Version                       | Scope                                                                        | Content source                                     |
| ----------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| **v1 — The book, with edits** | Reader, inline edit, baseline-diff marginalia                                | Mock: legacy ET transcription + auto-translated EN |
| **v2 — The book, annotated**  | + comment threads in marginalia (signed-in only)                             | Mock, or real if v3 landed first                   |
| **v3 — The book, canonical**  | + real PDF-extracted content replaces mock; optional reconciliation workflow | Real: extracted from `legacy/assets/*.pdf`         |

This spec is scoped to **v1**. v2 and v3 are sketched only where their structure constrains v1 design decisions.

### 1.4 The Hard Invariant

Every `para-id` is paired exactly once across EN and ET at every moment, including during edit commits. No operation in v1 may orphan, duplicate, or renumber a `para-id`. This holds for chapter titles (which are paragraphs with id `<chapter>-title`), body paragraphs, and any future paragraph types.

### 1.5 Explicitly out of v1 scope

- Pink background divergence marker (replaced by marginalia annotation)
- Comment storage, add-comment UI, thread display (v2)
- Reconciliation workflow — marking a paragraph as re-synced to PDF (v2 or v3)
- Real PDF-extracted content (v3)
- Search
- Typography polish beyond "a serif that reads well in EN and ET"
- `legacy-guard` lefthook hook restoration (tracked as a session-2 follow-up)
- Real auth ADR at `docs/decisions/0001-auth.md` (tracked as a session-2 follow-up)

## 2. User experience

### 2.1 Reader layout

The whole book is one long scrollable page. Chapter titles are treated as paragraphs with `para-id` of the form `<chapter>-title` and render with heading styling, but they live in the same paragraph tree as body text and participate in the same alignment, edit, and fetch pipelines. `/bigbook/` opens at the top of the book on first visit and at the user's saved `lastParaId` (from `localStorage`) on return.

**Top bar (persistent, ~40px tall).** Three zones:

- **Left:** `bigbook` wordmark, clickable, scrolls to the top of the book.
- **Center:** current chapter title in both languages (`How It Works · Kuidas see toimib`), clickable — opens a full-screen TOC overlay listing all chapters bilingually. Click a chapter to scroll-to-anchor; click outside to dismiss. The center title updates as the user scrolls, driven by an IntersectionObserver watching the `<chapter>-title` paragraphs.
- **Right:** prev/next chapter arrows (`◀ ▶`, scroll-to-anchor at the next/previous chapter title), plus the auth affordance (signed-out: "Sign in with GitHub"; signed-in: user avatar + menu). The prev/next arrows are kept for v1 but may be removed later if the scroll-only experience proves sufficient.

**Wide-viewport body (≥900px).** Three-column layout across the reader body:

1. **EN column** — ~45% of the non-marginalia width
2. **ET column** — ~55% of the non-marginalia width
3. **Marginalia column** — ~140px fixed

Expressed in CSS as `calc((100% - 140px) * 0.45)` for EN and `calc((100% - 140px) * 0.55)` for ET, with a 140px gutter after ET for marginalia. A thin vertical rule separates EN from ET; a subtle tonal shift separates ET from marginalia. The 45/55 ratio is a starting point and should be tuned once real Estonian content is imported — Estonian is typically 20-40% longer than English word-for-word, so the split may need to widen toward 40/60.

**Row alignment.** Each paragraph pair is a row of height `max(EN_height, ET_height)`. The shorter side is top-aligned within the row; the whitespace below it is reserved and non-visible (it is available for future marginalia anchoring). A thin horizontal rule separates rows.

**Footer.** A slim footer at the very bottom of the book (after the last paragraph of the last chapter) contains a thin horizontal rule and a small attribution line: `hosted on GitHub · github.com/mitselek/bigbook` (link to the repo). Muted serif, small. No prev/next in the footer — continuous scroll means there is no next chapter to offer at the end of the book. No AA license attribution for v1 — defer until the PO confirms the appropriate line.

### 2.2 Mobile (stacked pairs, <900px)

Below the 900px breakpoint, the three-column layout collapses into stacked paragraph pairs: EN paragraph, then ET paragraph directly below it, with a subtle indent or tonal marker distinguishing the two. Each stacked pair is still rigidly paired by `para-id` — there is no column drift, because there are no columns. The marginalia column moves inline: baseline-diff annotations render as tinted blocks below the relevant pair, visually distinct from the paragraph text.

The top bar collapses: the `bigbook` wordmark stays on the left, the chapter title stays in the center, the prev/next arrows and the auth affordance move into a single burger menu on the right.

### 2.3 Edit UX (signed-in users)

On wide viewports, every ET paragraph shows a small pencil icon at its top-right edge on hover, **only when the user is signed in**. Clicking the paragraph body or the pencil icon opens **inline edit mode**:

1. The ET paragraph's text is replaced in place by a bordered text box containing the current ET text. The EN paragraph next to it stays visible and unchanged. Other paragraph rows dim slightly to focus attention on the target.
2. Keyboard: `Esc` cancels and discards changes; `Ctrl/Cmd+Enter` commits. A tiny `commit` button and a `cancel` link appear at the bottom-right of the text box as visible affordances for non-keyboard users.
3. On `commit`, the editor fires `PUT /repos/mitselek/bigbook/contents/src/content/et/<chapter>.md` via the GitHub Contents API, using the signed-in user's access token. Commit message format: `edit(<para-id>): <first 60 chars of new text>`. Commit body: the new file content as base64, with the current `sha` for optimistic locking, targeting branch `main`.
4. On success: close the text box, re-render the paragraph from in-memory optimistic state with the new text, persist the new file `sha` to IndexedDB as the per-file `lastKnownSha`, and recompute the baseline diff so the marginalia annotation updates.
5. On failure: stay in edit mode and surface the error inline — see §3.6.

Anonymous users never see the pencil icon; clicking a paragraph does nothing.

On mobile, the flow is identical except the text box fills the full viewport width in place of the ET half of the stacked pair.

### 2.4 Marginalia column

**v1 populates the marginalia with baseline-diff annotations only, visible to everyone.** For each paragraph pair rendered, the client computes whether the current ET text differs from the baseline ET text (baseline mechanic in §3.5). If it differs:

- A small block in the marginalia column, aligned with that row, displays a bilingual label (`original · originaal`) followed by the baseline text in a smaller, slightly dimmed serif.
- Clicking the block expands it in place to show file-level commit metadata: the author and relative date of the most recent commit touching the chapter's ET file, fetched lazily on expand from `GET /repos/mitselek/bigbook/commits?path=src/content/et/<chapter>.md&per_page=1`. File-level (not paragraph-level) attribution is a v1 simplification — paragraph-specific blame would require walking git history per para-id, which is deferred to v2.
- Both anonymous and signed-in users see the annotation.

Paragraphs where current text equals baseline text have no annotation — the marginalia column space opposite that row is empty.

**v2 layers comment threads into the same column**, visible only to signed-in users. The comment threads render below the baseline annotation for each paragraph. The column is sized in v1 to accommodate both kinds of annotation without reflow.

### 2.5 Accessibility (v1 minimum bar)

- Keyboard nav for chapter-level movement (arrow keys mapped to prev/next chapter, `/` opens TOC).
- Tab order: top bar → first paragraph pair → marginalia annotation (if any) → next pair → …
- Each paragraph pair exposes a stable HTML anchor `#<para-id>` for deep-linking and an `aria-labelledby` pairing EN and ET for screen readers.
- Color is never the sole signal: the marginalia annotation uses explicit label text (`original · originaal`) rather than relying on a color contrast.

## 3. Engineering

### 3.1 Three-layer architecture

The three-layer boundary from `docs/architecture.md` is extended with concrete modules for v1:

```
src/
├── lib/                          # pure, headless, no UI runtime
│   ├── content/
│   │   ├── manifest.ts           # build-time: chapter list + para-id list + height estimates
│   │   ├── fetch.ts              # runtime fetch (current + baseline, SHA-pinned)
│   │   ├── parse.ts              # markdown → Map<para-id, text>
│   │   ├── diff.ts               # current vs baseline → Set<diverged para-ids>
│   │   └── baseline-config.ts    # BASELINE_COMMIT_SHA constant
│   ├── auth/                     # already built in session 2
│   │   ├── config.ts
│   │   ├── pkce.ts
│   │   ├── token-store.ts
│   │   └── github-client.ts
│   ├── github/
│   │   └── contents-api.ts       # PUT /repos/.../contents/{path}
│   └── reader/
│       ├── scroll-anchor.ts      # IntersectionObserver + current-chapter tracking
│       └── local-state.ts        # localStorage: lastParaId, session state
│
├── components/                   # UI — depends on lib/
│   ├── TopBar.astro
│   ├── TocOverlay.svelte         # interactive island
│   ├── Chapter.astro             # renders a chapter's skeleton + content
│   ├── ParagraphRow.svelte       # one EN/ET paragraph pair + marginalia slot
│   ├── Marginalia.svelte         # baseline-diff annotation for a row
│   ├── InlineEditor.svelte       # in-place ET text box
│   └── Footer.astro
│
└── pages/
    └── index.astro               # the one reader page — top of dep graph
```

The ESLint `no-restricted-imports` rule already enforces that `lib/` cannot import from `components/` or `pages/`, and `components/` cannot import from `pages/`. No module in v1 violates this.

**Interactive islands — Svelte 5.** This spec grants the approval that `common-prompt.md` was gating on. The interactive islands (`TocOverlay`, `ParagraphRow`, `Marginalia`, `InlineEditor`) need client-side reactive state — Svelte 5 with `@astrojs/svelte` is the cheapest integration with Astro 5. Astro components (`.astro`) are used wherever the component is static.

### 3.2 Content file format

Each chapter is stored as two markdown files, one per language:

```
src/content/et/<chapter>.md
src/content/en/<chapter>.md
```

Each file has YAML frontmatter for chapter metadata and a body of paragraphs, each prefixed by a `::para[id]` directive on its own line:

```markdown
---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest, kes oleks läbi kukkunud, kui ta oleks põhjalikult järginud meie teed. Need, kes ei parane, on inimesed, kes ei saa või ei taha end täielikult pühendada sellele lihtsale programmile.

::para[ch05-p002]
Meie lood avaldavad üldjoontes, millised me olime.
```

**The `::para[id]` directive is a project-specific convention**, not a standard markdown feature. A small parser in `src/lib/content/parse.ts` recognizes it, splits the file into a `Map<para-id, string>`, and strips the directive lines from the rendered output. The custom directive was preferred over HTML comments, semantic HTML wrappers, or frontmatter paragraph arrays because it is the simplest format to safely rewrite from the inline editor: locate the target marker, locate the next marker (or EOF), and replace the text between them. Readers who need a standards-compliant alternative should note this as a v1 tradeoff.

### 3.3 Content pipeline (mock, v1-v2)

A one-shot bootstrap script at `scripts/bootstrap-mock-content.mjs`, run locally by Plantin and committed once with `CONTENT_BOOTSTRAP=1`, performs:

1. **Walk the legacy markdown tree** under `legacy/peatykid/`, `legacy/kogemuslood/`, `legacy/lisad/`, `legacy/front_matter/`. Each `.md` file becomes one chapter.
2. **Strip Jekyll frontmatter and liquid tags** from each file. Keep only the body text.
3. **Split into paragraphs on blank lines.** Assign `para-id` of form `<chapterSlug>-p<ordinal>` starting at `p001`. If the file's first non-empty block looks like a title (heading markdown or a short line), it gets id `<chapterSlug>-title`.
4. **Write to `src/content/et/<chapterSlug>.md`** in the format above.
5. **Auto-translate ET → EN via the Claude API.** The script calls Claude (opus or sonnet, TBD at implementation time) with a prompt that requires preserving paragraph boundaries and `::para[id]` markers exactly. The API key lives in an env var (`CLAUDE_API_KEY`), not committed to the repo. This is a one-off operation — the script runs once per language-content-bootstrap, not on every commit.
6. **Write to `src/content/en/<chapterSlug>.md`** with para-ids preserved.
7. **Verify the Hard Invariant** — every para-id appears exactly once in both language files. Abort and report if any paragraph is missing, duplicated, or malformed.
8. **Emit `src/lib/content/manifest.ts`** with the full chapter list, para-id lists per chapter, and default estimated row heights (fixed constants per type — `title: 60px`, `body: 110px`).

**Two-commit baseline capture.** Step 9 — wiring the baseline SHA — is done via two successive commits, not one amend:

1. **Commit A (content bootstrap):** add `src/content/en/*.md`, `src/content/et/*.md`, and `src/lib/content/manifest.ts`. Commit message: `content: mock bootstrap from legacy ET + auto-translated EN`, committed with `CONTENT_BOOTSTRAP=1` set in the environment. Record commit A's SHA after the commit.
2. **Commit B (baseline constant):** write `src/lib/content/baseline-config.ts` containing `export const BASELINE_COMMIT_SHA = '<commit A's sha>';` and commit. Commit message: `content: pin baseline SHA to <short sha>`. This commit is metadata only, does not touch `src/content/`, and does not need `CONTENT_BOOTSTRAP=1`.

Commit A is the baseline the reader diffs against; commit B points at it. The two commits land together in the same PR (or the same push to main, if working directly).

Run path: `CONTENT_BOOTSTRAP=1 node scripts/bootstrap-mock-content.mjs`. The env var bypasses the content-guard lefthook hook (known-deferred as of session 2). The script is a bootstrap-tier concern, not an ongoing part of the app build.

When v3 real-content extraction lands, it will run a sibling script (or a new subagent-driven pipeline) that produces the same file format and emits a new baseline SHA. The reader's runtime behavior is unchanged — only the constant in `baseline-config.ts` moves.

### 3.4 Runtime fetch (lazy loading with anchor preservation)

The built shell boots with `manifest.ts` and `baseline-config.ts` baked in as static imports — no fetch is needed to know the book's structure. On page load:

1. The page renders a full-book skeleton: one section per chapter, and within each section one skeleton row for every `para-id` the manifest lists for that chapter. Each row is sized to the estimated height for its type (`title: 60px`, `body: 110px`). A 30-paragraph chapter therefore renders 30 stacked skeleton rows up front. This is immediate, no network.
2. The skeleton rows are each tagged with their `para-id` so `#<para-id>` deep-links scroll to the right position even before content has loaded.
3. An IntersectionObserver watches chapter section elements. When a section enters a 1.5-viewport preload buffer (ahead of or behind the visible area), its content is fetched.
4. For each chapter entering the buffer, the client fires three parallel fetches. EN and baseline ET go to **raw.githubusercontent.com** at SHA-pinned URLs (immutable, CDN-cached effectively forever, zero API rate-limit cost). Current ET goes to the **GitHub REST Contents API** at `api.github.com`, which supports CORS with custom headers from browsers and returns the git blob SHA alongside the content:
   - **Current ET** — `GET https://api.github.com/repos/mitselek/bigbook/contents/src/content/et/<chapter>.md` — response body is `{ sha, content (base64), ... }`, response headers include `ETag`. On refetch, the client sends `If-None-Match: <etag>`; GitHub responds `304 Not Modified` (no body, no rate-limit cost) if unchanged, or `200 OK` with a new body and new ETag if it has changed.
   - **EN** — `GET https://raw.githubusercontent.com/mitselek/bigbook/<BASELINE_COMMIT_SHA>/src/content/en/<chapter>.md` (SHA-pinned; immutable; plain GET)
   - **Baseline ET** — `GET https://raw.githubusercontent.com/mitselek/bigbook/<BASELINE_COMMIT_SHA>/src/content/et/<chapter>.md` (SHA-pinned; immutable; plain GET)
5. The two raw.github fetches are plain `fetch(url)` calls — no custom headers, no methods other than GET (per the raw.githubusercontent.com CORS constraint). The Contents API fetch uses full CORS including `If-None-Match` on conditional refetches. When the signed-in user's access token is available in memory, the Contents API fetch also attaches `Authorization: Bearer <token>` to upgrade from the 60 req/hr anonymous budget to the 5000 req/hr authenticated budget; otherwise it runs anonymously.
6. When the three fetches resolve, the client parses each into a `Map<para-id, text>`, computes `diff(currentEt, baselineEt)` to identify diverged paragraphs, and replaces the skeleton rows for that chapter with real `ParagraphRow` components. The Contents API response also yields the git blob `sha` and the `ETag`, which are persisted to IndexedDB per chapter file as `lastKnownSha` (used for the edit-commit optimistic lock) and `lastEtag` (used for subsequent conditional refetches).
7. `overflow-anchor: auto` on the body element ensures that when a chapter's real content inflates its height above the user's current scroll position, the visible paragraph stays pinned at its y-offset.

**Jump-to-chapter** (TOC click, prev/next arrow, `#anchor` URL) forces an immediate fetch of the target chapter's content before scrolling, even if it is not yet in the preload buffer.

**Cross-session freshness.** On session resume, the client's first conditional GET to the Contents API with the persisted `lastEtag` tells us in one round-trip whether the file has changed since last session: 304 → use cached content directly; 200 → new content, new SHA, new ETag. No separate freshness tracking is needed for current ET beyond storing the ETag. EN and baseline ET are immutable and require no freshness handling.

**EN is fetched from the baseline SHA, not from `main`.** EN content is not user-editable in v1 — only ET is — so the file content at `main` and at `BASELINE_COMMIT_SHA` are identical by construction, and pinning EN to the baseline SHA is strictly better: it's immutable, CDN-cached forever, and skippable on visibility-change refresh. When a future version adds EN editing (not planned through v3), EN fetches would move back to the live branch and re-gain a `currentEn` distinction. For now there is no `currentEn`; there is only `en`, and it lives at the baseline.

**Visibility-change refresh.** A `document.visibilitychange` listener on the reader page: when the tab returns to `visible` after more than ~2 minutes hidden, re-fire the `If-None-Match`-conditioned Contents API GET for every chapter currently in the preload buffer. A 304 response is a no-op (no parse, no re-render, no rate-limit cost); a 200 response flows through the normal parse + diff + render path and refreshes `lastKnownSha` + `lastEtag`. EN and baseline ET are never refetched (immutable). This is the cheapest possible v1 freshness story for ordinary readers, and for signed-in contributors it doubles as an early-warning for editor-vs-editor concurrency (seeing someone else's edit before trying to land your own). Live polling of concurrent editors/commenters is deferred to v2 alongside the comment system (see §5).

**Module shape for fetch.** `src/lib/content/fetch.ts` exposes three functions:

```ts
export async function fetchEn(chapter: string): Promise<string>
export async function fetchBaselineEt(chapter: string): Promise<string>

export type CurrentEtResult =
  | { status: 'unchanged' }
  | { status: 'fetched'; content: string; sha: string; etag: string }

export async function fetchCurrentEt(chapter: string, prevEtag?: string): Promise<CurrentEtResult>
```

Calling code branches on the discriminated union — `'unchanged'` is a no-op; `'fetched'` triggers parse/diff/render and persists the new `sha` + `etag`. No byte-wise content comparison is ever needed; the HTTP layer tells us definitively whether the content has changed.

### 3.5 Edit commit flow

```
user edits ET text in InlineEditor.svelte and hits Ctrl/Cmd+Enter
  ↓
InlineEditor fires onCommit(paraId, newText)
  ↓
src/lib/github/contents-api.ts builds the new file content:
  - fetch current chapter file text from in-memory state (which the page is already showing)
  - replace the text block between ::para[<paraId>] and the next ::para[...] marker (or EOF) with newText
  - base64-encode the new full file content
  ↓
PUT /repos/mitselek/bigbook/contents/src/content/et/<chapter>.md
  body: { message: "edit(<paraId>): <first 60 chars>", content: <base64>, sha: <lastKnownSha>, branch: "main" }
  ↓
on 200 OK: update in-memory state with newText, re-render the row, persist new sha to IndexedDB, recompute diff → marginalia updates
on 409 (conflict — sha mismatch): surface inline "this paragraph was edited by someone else — refresh and retry", stay in edit mode
on 401: trigger silent refresh-token flow, retry once; if still 401, bounce to re-auth
on 422 or other error: surface inline with the GitHub error message, stay in edit mode
```

Commits land directly on `main`. No PR, no branch. The GitHub App proxies the user's identity via the user access token, so the commit author is the signed-in user on GitHub (not a bot).

### 3.6 Error handling (v1)

| Failure mode                                                                                                                                                    | Response                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime fetch 404                                                                                                                                               | Render an error row in place of the chapter; log to console; allow manual retry                                                                                                                                    |
| Runtime fetch network error                                                                                                                                     | Same as 404                                                                                                                                                                                                        |
| Edit pre-flight validation failure (Layer C gate, see §3.8)                                                                                                     | Surface an inline validation error in the edit box naming the specific problem (e.g., "para-id ch05-p007 would be orphaned"); do not fire the PUT; do not touch optimistic local state; keep the user in edit mode |
| Edit commit 409 (sha conflict)                                                                                                                                  | Inline error on the edit box; user must refresh the paragraph and retry                                                                                                                                            |
| Edit commit 401 (token expired)                                                                                                                                 | Silent refresh attempt; if that fails, bounce to re-auth                                                                                                                                                           |
| Edit commit 422 or other 4xx                                                                                                                                    | Inline error with GitHub's message; stay in edit mode                                                                                                                                                              |
| Runtime parse / Hard Invariant failure on a fetched content file (malformed content landed on main, e.g., from a user edit that bypassed pre-flight validation) | Render the affected chapter as a single error row with a short explanation and a manual reload affordance; log details to console; keep the rest of the book working normally                                      |
| Hard Invariant violation at dev time (Vitest parser test, or the `hard-invariant` lefthook pre-commit hook)                                                     | Throw loudly — this is a bug or a data-quality failure that must be fixed before commit; fail the test suite / block the commit                                                                                    |
| Baseline fetch failure                                                                                                                                          | Render the paragraph without baseline annotation; log; do not block reading                                                                                                                                        |

### 3.7 Testing strategy

- **`src/lib/` — unit tests via Vitest, ≥90% coverage target** (matching the Layer 3 quality gate in `common-prompt.md`). Every pure module has its own test file under `tests/lib/`. Fetch-adjacent modules mock `fetch` globally.
- **`src/components/` — component tests via Vitest + `@testing-library/svelte`** for the Svelte islands. Render + interact + assert. Fixtures under `tests/fixtures/` (mock paragraph maps, mock manifests). **No numeric coverage threshold; behavior-driven.** Every user-visible capability (sign in, click to edit, type + commit, Esc to cancel, TOC open/close, marginalia expand, scroll anchor, visibility-change refresh) must have at least one test that exercises it. We optimize for "every user-facing capability has a test," not for "X% of Svelte-compiled code is covered." Enforced by code review rather than by a percentage.
- **`src/pages/` — not unit-tested.** Covered by the existing smoke test that Astro builds cleanly with a synthetic manifest fixture.
- **End-to-end tests via Playwright.** The v1 E2E suite replaces the earlier "one Vitest integration test against mocked Contents API" note. Tests run in real browsers against a mocked GitHub (via Playwright's request interception) and cover at minimum: anonymous reader happy path (landing → scroll → TOC jump → deep-link anchor resolves → visibility-change refresh → 304 no-op); signed-in editor happy path (sign in → edit a paragraph → commit → marginalia updates to show diff); error paths (expired token → silent refresh → commit; 409 sha conflict → inline error; pre-flight validation failure → inline error, no PUT; malformed content on fetch → graceful error row).
- **Playwright browser matrix.** On pull requests, run against **Chromium only**. On pushes to `main`, run against **Chromium, Firefox, and WebKit**. Cross-browser regressions are caught before the Pages deploy step runs, without tripling CI minutes on every PR.
- **Accessibility testing.** ESLint a11y rules from `eslint-plugin-svelte` (built-in since v2) and `eslint-plugin-astro` (a11y rule subset) run as part of the lint gate and catch most static a11y mistakes. Optional: `axe-core` run inside Playwright E2E tests to catch runtime a11y issues that ESLint can't see (e.g., dynamic focus management on TOC open/close). Treat axe-core as nice-to-have in v1.
- **The Hard Invariant has its own test module** (`tests/lib/invariant.test.ts`) that validates: parser emits para-ids uniquely; diff only reports paragraphs present in both current and baseline; edit operations preserve all para-ids in both files.
- **Shared validator module at `src/lib/content/validate.ts`.** This single module is the canonical implementation of "is a proposed content file well-formed?" — runs parse, checks YAML frontmatter, verifies unique non-empty `para-id` set, verifies no orphan markers. It has three consumers, all using the same implementation: (a) the Vitest unit tests and `invariant.test.ts`; (b) the inline editor's client-side pre-flight validation before firing a PUT (§3.8 Layer C); (c) the `hard-invariant` lefthook pre-commit hook (§3.8 Layer A). One implementation, three call sites — fix a bug in one place and all three gates get the fix.

### 3.8 Quality gates

The v1 quality gate strategy is split across **three layers**, chosen based on _where the commit originates_. Dev-team commits and user-edit commits follow different paths to `main`, and the gate architecture acknowledges that asymmetry.

#### Layer A — Pre-commit hooks (lefthook, dev team only)

These run locally on dev-team commits via lefthook, before `git push`. They do **not** run on user-edit commits: user edits are created server-side by GitHub in response to Contents API calls, with no local git and no lefthook involvement. Layer A's job is to keep the dev team's commits clean; it is not a gate for user edits.

| Hook             | What it checks                                                                                                                                                                                                      | Status in v1                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `typecheck`      | `tsc --noEmit` clean under the strict TS config                                                                                                                                                                     | Active from session 2                                                                                                                                                                                  |
| `eslint`         | Zero warnings on staged files. Rules: default, type hygiene (`no any`, `no !`, `no @ts-ignore`), architecture (`no-restricted-imports`), a11y (`eslint-plugin-svelte` + `eslint-plugin-astro`)                      | Active from session 2; a11y rules added in v1                                                                                                                                                          |
| `prettier`       | `prettier --check` clean on staged files                                                                                                                                                                            | Active from session 2                                                                                                                                                                                  |
| `legacy-guard`   | Block staged diffs under `legacy/` unless `LEGACY_OVERRIDE=1` is set and PO approval is recorded in the commit body                                                                                                 | Deferred in session 2 due to shell-escaping bug on Git Bash Windows; **restored in v1** by moving the logic to `scripts/legacy-guard.sh` and invoking via `bash scripts/legacy-guard.sh` from lefthook |
| `content-guard`  | Block staged diffs under `src/content/` unless `CONTENT_BOOTSTRAP=1` is set. **Scope: dev-team local commits only** — has no effect on user-edit commits (which lefthook can't see) and needs no exception for them | New in v1                                                                                                                                                                                              |
| `hard-invariant` | Parse all staged content files via `src/lib/content/validate.ts` and fail the commit if any para-id is missing its pair, duplicated, or malformed                                                                   | New in v1                                                                                                                                                                                              |

#### Layer B — CI gates (GH Actions, every PR and every push to `main`)

These run in GH Actions and apply equally to dev-team PRs and to user-edit commits (which appear on `main` as direct pushes). Layer B is the only gate that actually sees user-edit commits.

| Gate                              | What it checks                                                                                                                                                 | Action on fail                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `typecheck + lint + format:check` | Full-tree equivalent of the Layer A hooks                                                                                                                      | PR blocked; a post-merge failure on `main` emails Plantin |
| `test`                            | Full Vitest suite (unit + component), zero failures                                                                                                            | Same                                                      |
| `test:coverage`                   | `src/lib/` ≥ 90% lines/functions/statements, ≥ 85% branches. No numeric target on `src/components/` (behavior-driven, enforced at review time)                 | Same                                                      |
| `build`                           | `astro build` succeeds with zero warnings. If a user-edit commit breaks the build, the deploy step is skipped and the site keeps serving the last good version | PR blocked; deploy skipped on `main`                      |
| `size-limit`                      | JS / CSS / HTML bundle budgets from `.size-limit.json` (see below)                                                                                             | Same                                                      |
| `playwright`                      | PR: Chromium only. `main`: Chromium + Firefox + WebKit                                                                                                         | Same                                                      |

#### Layer C — Client-side pre-flight (user edits only)

Runs in the browser inside `InlineEditor.svelte` before firing `PUT /repos/.../contents/<path>`. Uses the same `src/lib/content/validate.ts` module as Layer A's `hard-invariant` hook and Vitest's `invariant.test.ts`.

Before the PUT:

1. Construct the proposed new file content by replacing the text block between `::para[<paraId>]` and the next marker (or EOF).
2. Call `validate(newContent)` — which parses, verifies YAML frontmatter is valid, verifies all para-ids are unique, verifies the set of para-ids in the new file matches the set in the file being edited (no para-id added, removed, or renamed as a side effect of a text edit).
3. On validation failure: surface an inline validation error on the edit box with a specific message (e.g., "validation error: para-id `ch05-p007` would be orphaned"). Do not fire the PUT. Do not update optimistic local state. Keep the user in edit mode.
4. On validation pass: fire the PUT as described in §3.5.

**Effective against accidental malformed edits, not against malicious API misuse.** A determined user could call the GitHub Contents API directly with curl and bypass Layer C entirely. That's a deliberate act, not an accident, and v1's failure model is "accidents from the editor UI," not "malicious trusted contributors." If bypass becomes a real problem we revisit a server-side validation proxy in the Cloudflare Worker (see §5).

**Runtime fallback.** The reader parses every fetched content file via the same `validate.ts` module. If a malformed user edit somehow reaches `main` (bypass, race, unknown bug), the reader degrades gracefully per §3.6: the affected chapter renders as a single error row; the rest of the book keeps working; details log to console.

#### Bundle size budget (`.size-limit.json`)

`size-limit` runs as a hard CI gate. Concrete thresholds are set **after** measuring the first green v1 build — start at roughly 2× measured values as headroom, ratchet down as the app stabilizes. Placeholder targets so the plan writer has something to aim at:

| Bundle                           | Budget (gzipped) | Notes                                                              |
| -------------------------------- | ---------------- | ------------------------------------------------------------------ |
| Total JS in `dist/_astro/*.js`   | ~75 KB           | Svelte 5 runtime + 4 interactive islands + auth + fetch/parse/diff |
| Total CSS in `dist/_astro/*.css` | ~20 KB           | Reader typography + column layout + marginalia                     |
| Raw `dist/index.html`            | ~80 KB           | Shell + skeleton for ~20 chapters × ~30 paragraphs each            |

**Lighthouse CI is deliberately not in v1.** It needs a preview deploy URL or a serve-and-audit dance, which is new infra and CI minutes we're choosing not to spend.

#### Browser matrix

| Tier       | Browsers                             | Support level                                                                                                                                                                                                                                                                                                          | CI coverage                                                                                            |
| ---------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Tier 1** | Chrome 100+, Firefox 100+, Edge 100+ | Full experience. `overflow-anchor: auto` preserves scroll stability when lazy-load content replaces skeletons. All gates tested.                                                                                                                                                                                       | Chromium on every PR; Firefox added on push to `main`                                                  |
| **Tier 2** | Safari 15+, iOS Safari 15+           | Reader works; `overflow-anchor` is not supported by Safari at any version, so lazy-load skeleton replacements may cause small scroll jumps when the real chapter height differs from the skeleton estimate. Acknowledged limitation, mitigated by tuning skeleton height estimates against real content once it lands. | WebKit on push to `main` (Playwright's WebKit is a reasonable Safari proxy for function-level testing) |
| **Tier 3** | Pre-2019 browsers, IE11              | No support statement. May render broken.                                                                                                                                                                                                                                                                               | None                                                                                                   |

If Safari's scroll-jump limitation becomes a user complaint in v1, v2 ships a measure-off-screen-before-insert fix (see §5). v1 defers on the assumption that tuned estimates are good enough for a low-traffic reader.

## 4. Open questions

Items that are deliberately undecided at spec time and should be resolved at implementation time:

- **Final EN/ET split ratio.** 45/55 is a starting point; the real ratio depends on the imported content and should be tuned once mock content lands.
- **Estimated row heights in the manifest.** `title: 60px`, `body: 110px` are guesses; should be tuned against real rendered content to minimize layout shift on lazy load.
- **Claude API model choice for the bootstrap translation script.** opus is more accurate, sonnet is cheaper. Decide when running the script; either works.
- **Commit body wording for the edit commit.** Format `edit(<para-id>): <first 60 chars>` is approved; exact commit body (if any beyond the title) is TBD.
- **AA license attribution in the footer.** TBD whether to include a license line and what it should say — flagged for PO review separately.
- **Size-limit thresholds.** Concrete JS / CSS / HTML budgets are set after the first green v1 build — measure the actual bundle sizes, set the budget at roughly 2× measured as headroom, ratchet down as the app stabilizes.

## 5. Follow-ups tracked outside this spec

- Write the real auth ADR at `docs/decisions/0001-auth.md`
- Node 20 → 24 migration on GH Actions once upstream actions ship
- Triage the 10 moderate-severity `npm audit` advisories from the session 2 scaffold
- v2 design: comment storage (sidecar JSON per chapter committed via the same Contents API), add/reply UI, visibility rules
- v2 freshness: live polling of currently-visible chapters for signed-in users (per-chapter or batched via `GET /repos/.../git/trees/main:src/content/et` for one call covering every chapter's SHA at once), gated on signed-in status so anonymous users do not burn the 60/hr API budget. Ties in with v2 comments, where real-time visibility of new comments is most valuable.
- Lighthouse CI: considered for v1 and deferred because it needs a preview-deploy URL and spends meaningful CI minutes per run. Revisit if Cloudflare Pages preview deploys are wired up for any other reason, or if `size-limit` alone proves insufficient at catching performance regressions.
- Server-side validation proxy for user-edit commits via the Cloudflare Worker. Considered for v1 (option B from the quality-gate discussion) and deferred in favor of client-side pre-flight (Layer C). Revisit in v2 if accidental malformed edits slip past the browser validator in practice, or if a non-UI API caller produces garbage.
- Safari scroll-anchor workaround: off-screen height measurement before DOM swap, so the lazy-load skeleton replacement has the correct height before entering the scroll context. Considered for v1 and deferred in favor of tuned skeleton estimates. Revisit in v2 if Safari users report visible scroll jumps.
- v3 design: PDF extraction subagent pipeline, reconciliation workflow, real baseline replacement

(_BB:Plantin_)
