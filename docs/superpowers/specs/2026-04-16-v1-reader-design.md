# v1-reader — Plan 2 Design

- **Status:** Approved
- **Date:** 2026-04-16
- **Author:** Plantin (team-lead, bigbook-dev)
- **Parent spec:** [`2026-04-14-bigbook-reader-design.md`](./2026-04-14-bigbook-reader-design.md) (the full v1 product spec)
- **Scope:** Read-only bilingual reader. Excludes inline editor, PUT to Contents API, editor pre-flight, and auth-gated pencil icons (those are Plan 3).

## 1. Scope & Relationship to Parent Spec

Plan 2 delivers the **read-only bilingual reader** described in the parent spec (§2.1–§2.5, §3.1–§3.4, §3.7–§3.8). The inline editor, Contents API writes, editor pre-flight validation, and auth-gated pencil icons are deferred to Plan 3 (v1-editor).

Plan 2 consumes the v1-foundation primitives landed in sessions 4–8: `parse.ts`, `validate.ts`, `diff.ts`, `manifest.ts`, `baseline-config.ts`, and the 16 chapter pairs in `src/content/{en,et}/`.

### New modules

**`src/lib/` (pure, headless):**

- `content/fetch.ts` — runtime fetch for EN, baseline ET (SHA-pinned, raw.github), and current ET (Contents API with `If-None-Match` ETag support)
- `reader/scroll-anchor.ts` — IntersectionObserver callback logic for chapter-section preload triggers and current-chapter tracking (drives top-bar title sync)
- `reader/local-state.ts` — localStorage wrapper for `lastParaId` (return-visit scroll position)

**`src/components/` (UI):**

- `TopBar.astro` — persistent top bar with three zones (wordmark, bilingual chapter title, nav + auth)
- `TocOverlay.svelte` — full-screen grouped TOC overlay (interactive island)
- `Chapter.astro` — chapter section wrapper (skeleton → real content)
- `ParagraphRow.svelte` — one EN/ET paragraph pair with marginalia slot (interactive island)
- `Marginalia.svelte` — baseline-diff annotation with expand-to-commit-metadata (interactive island)
- `Footer.astro` — slim attribution footer

**`src/pages/`:**

- `index.astro` — rewritten from the auth PoC landing page into the reader page

## 2. Reader Layout (Wide Viewport, ≥900px)

Three-column layout across the reader body:

| Column     | Width                         | Notes                                       |
| ---------- | ----------------------------- | ------------------------------------------- |
| EN         | `calc((100% - 140px) * 0.45)` | Left. Thin vertical rule on the right edge. |
| ET         | `calc((100% - 140px) * 0.55)` | Middle.                                     |
| Marginalia | 140px fixed                   | Right. Subtle tonal shift from ET.          |

The 45/55 ratio is a starting point and may be tuned once real content lands (Estonian is typically 20–40% longer than English).

Each paragraph pair is one row of height `max(EN_height, ET_height)`. The shorter side is top-aligned within the row. Thin horizontal rules separate rows. Chapter titles are paragraphs with `para-id` of the form `<chapter>-title` and render with heading styling in the same paragraph grid.

**Visual tone:** Background `#faf8f5` (warm cream). Body text: system serif stack `Georgia, 'Times New Roman', serif`, 15px, line-height 1.7. Typography polish (webfont) deferred to v1-ship.

## 3. Mobile Layout (<900px)

Stacked paragraph pairs: EN on top, ET below. Small "EN" / "ET" labels (9px uppercase, `system-ui` sans-serif, muted gray `#aaa`) above each paragraph. Same background for both languages.

Marginalia renders as inline tinted blocks below the relevant pair, visually distinct from paragraph text (background `#faf5ee`, left border `#d4a574`).

**Top bar collapses:** `bigbook` wordmark stays left. Bilingual chapter title stays center (truncated with ellipsis). Prev/next arrows and auth affordance move into a burger menu (☰) on the right.

## 4. Top Bar

Persistent, ~40px tall, white background (`#fff`), bottom border (`#e0ddd8`). Font: `system-ui, sans-serif`, 13px.

- **Left:** `bigbook` wordmark, bold 15px, clickable — scrolls to top of book.
- **Center:** Bilingual chapter title (`Chapter 1: Bill's Story · Peatükk 1: Billi lugu`), clickable — opens TOC overlay. Updates as user scrolls via IntersectionObserver watching `<chapter>-title` paragraph elements.
- **Right:** Prev/next chapter arrows (`◀ ▶`, scroll-to-anchor), plus auth affordance (existing session-2 code: "Sign in with GitHub" when signed out, avatar + username when signed in).

## 5. TOC Overlay

Full-screen overlay triggered by clicking the center title or pressing `/`.

**Grouped with subtle section headers:**

- **Front matter** — `cover`, `eessonad`, `arsti-arvamus`
- **Chapters** — `ch01-billi-lugu` through `ch11-tulevikupilt-te` (11 chapters)
- **Appendices** — `lisad`, `index`

The grouping is derived from the slug pattern in `manifest.ts`: slugs starting with `ch` are chapters; the rest are classified by a static map in the TOC component. Display order within each group follows the manifest's array order.

Each entry shows bilingual title. Click scrolls to chapter anchor and dismisses the overlay.

**Dismiss behavior (toggle):** Click outside, press Esc, or click the center title again (toggle). Keyboard navigation: arrow keys move between entries, Enter selects.

## 6. Runtime Fetch Pipeline

### Boot sequence

1. Page loads with `manifest.ts` and `baseline-config.ts` as static imports — no fetch needed to know the book's structure.
2. Render full-book skeleton: one section per chapter, blank rows (sized empty divs with horizontal rules) per `para-id`. Row heights from manifest estimates (`title: 60px`, `body: 110px`). No pulsing animation — quiet, book-like.
3. Skeleton rows tagged with `para-id` so `#<para-id>` deep-links resolve before content loads.

### Lazy fetch

4. IntersectionObserver watches chapter section elements with `rootMargin: '150%'` (1.5-viewport preload buffer). When a chapter enters the buffer, fire three parallel fetches:
   - **EN:** `https://raw.githubusercontent.com/mitselek/bigbook/<BASELINE_COMMIT_SHA>/src/content/en/<chapter>.md` — SHA-pinned, immutable, CDN-cached effectively forever. Plain `fetch(url)`, no custom headers.
   - **Baseline ET:** `https://raw.githubusercontent.com/mitselek/bigbook/<BASELINE_COMMIT_SHA>/src/content/et/<chapter>.md` — same as EN: SHA-pinned, immutable.
   - **Current ET:** `https://api.github.com/repos/mitselek/bigbook/contents/src/content/et/<chapter>.md` — Contents API, full CORS. Supports `If-None-Match: <etag>` for conditional refetch. When a signed-in user's access token is available, attach `Authorization: Bearer <token>` to upgrade from 60 req/hr anonymous to 5000 req/hr authenticated budget.
5. Parse each response into `Map<para-id, text>` via `parse.ts`, compute `diff(currentEt, baselineEt)` via `diff.ts`, replace skeleton rows with `ParagraphRow` components.
6. Persist `sha` + `etag` from the Contents API response to IndexedDB per chapter file.
7. `overflow-anchor: auto` on body for scroll stability during skeleton → content swap.

### Jump-to-chapter

TOC click, prev/next arrow, or `#anchor` URL forces immediate fetch of the target chapter's content before scrolling, even if it is not yet in the preload buffer.

### Visibility-change refresh

`document.visibilitychange` listener: when the tab returns to `visible` after >2 minutes hidden, re-fire conditional GETs (`If-None-Match`) for current ET of every chapter currently in the preload buffer. 304 = no-op (no parse, no re-render, no rate-limit cost). 200 = re-parse, re-render, update `sha` + `etag`. EN and baseline ET are never refetched (immutable).

### Cross-session freshness

On session resume, the first Contents API GET with the persisted `etag` determines freshness in one round-trip. 304 = use cached content. 200 = new content.

### `fetch.ts` module shape

```ts
export async function fetchEn(chapter: string): Promise<string>
export async function fetchBaselineEt(chapter: string): Promise<string>

export type CurrentEtResult =
  | { status: 'unchanged' }
  | { status: 'fetched'; content: string; sha: string; etag: string }

export async function fetchCurrentEt(chapter: string, prevEtag?: string): Promise<CurrentEtResult>
```

## 7. Marginalia

For each paragraph where current ET differs from baseline ET (detected by `diff.ts`):

- **Wide viewport:** Annotation in the 140px marginalia column, aligned with the row.
- **Mobile:** Inline tinted block below the relevant stacked pair.
- **Label:** "originaal" (Estonian only).
- **Body:** Baseline ET text in smaller font (11px), dimmed (`#999`), italic.
- **Expand on click:** In-place expand to show file-level commit metadata — author and relative date of the most recent commit touching the chapter's ET file. Fetched lazily on expand from `GET /repos/mitselek/bigbook/commits?path=src/content/et/<chapter>.md&per_page=1`. File-level (not paragraph-level) attribution is a v1 simplification.

Paragraphs with no diff have empty marginalia (no annotation rendered).

Both anonymous and signed-in users see annotations.

## 8. Scroll Anchoring & Deep Links

- Every paragraph pair has a stable HTML anchor `#<para-id>`.
- `aria-labelledby` pairing EN and ET elements for screen readers.
- On first visit: open at top of book.
- On return visit: scroll to `lastParaId` from localStorage.
- Deep-link URLs (`/bigbook/#ch05-p003`) scroll to the correct position even before content loads — skeleton rows are sized by manifest estimates.
- Keyboard navigation: arrow keys mapped to prev/next chapter, `/` opens TOC.
- Tab order: top bar → first paragraph pair → marginalia annotation (if any) → next pair → …

## 9. Testing Strategy

### `src/lib/` — unit tests via Vitest, ≥90% coverage target

- **`content/fetch.ts`** — mock `fetch` globally. Cases: successful fetch (EN, baseline ET, current ET), 304 not-modified (current ET with etag), network error, parse error on malformed response.
- **`reader/scroll-anchor.ts`** — mock IntersectionObserver. Cases: chapter enters buffer → callback fires; chapter exits buffer → no action; multiple chapters in buffer simultaneously.
- **`reader/local-state.ts`** — mock localStorage. Cases: read/write `lastParaId`, missing key returns null, storage full graceful fallback.

### `src/components/` — behavior-driven, no numeric threshold

- **`ParagraphRow.svelte`** — renders EN and ET text from props, applies correct column widths, renders heading style for title para-ids.
- **`Marginalia.svelte`** — renders annotation when diff detected, hides when no diff, expand/collapse on click, lazy fetch triggers on expand.
- **`TocOverlay.svelte`** — opens on trigger, groups chapters correctly, keyboard navigation (arrows + Enter), dismiss on Esc / click-outside / toggle.

### Playwright E2E

Anonymous reader happy path: landing → scroll → content loads from skeleton → TOC jump → deep-link anchor resolves → visibility-change refresh → 304 no-op.

- **PR:** Chromium only.
- **Push to `main`:** Chromium + Firefox + WebKit.

GitHub API calls mocked via Playwright request interception.

### Existing tests

All 42 tests from v1-foundation remain green. Plan 2 adds new test files; it does not modify existing ones.

## 10. Footer

Slim footer at the bottom of the book (after the last paragraph of the last chapter). Thin horizontal rule, then a small muted attribution line: `hosted on GitHub · github.com/mitselek/bigbook` (link to repo). Georgia serif, small, muted. No AA license attribution in v1 — deferred until PO confirms the appropriate line.

## 11. Decisions Record

Decisions made during the Plan 2 brainstorm session (session 9, 2026-04-16):

| #   | Decision                      | Choice                                         | Alternatives considered                      |
| --- | ----------------------------- | ---------------------------------------------- | -------------------------------------------- |
| 1   | Scope split                   | Plan 2 = reader, Plan 3 = editor               | All-of-v1 in one plan; three-way split       |
| 2   | Auth UI in Plan 2             | Include sign-in + avatar (session-2 code)      | Defer all auth UI to Plan 3                  |
| 3   | Typography                    | System serif stack (Georgia)                   | Webfont (Literata/Lora), self-hosted webfont |
| 4   | Reader layout                 | 45/55 EN/ET + 140px marginalia, approved       | —                                            |
| 5   | Skeleton loading              | Blank rows (quiet, book-like)                  | Pulsing skeleton bars                        |
| 6   | TOC dismiss                   | Toggle (click outside, Esc, or re-click title) | Click outside + Esc only                     |
| 7   | TOC grouping                  | Grouped (Front matter / Chapters / Appendices) | Flat list                                    |
| 8   | Mobile language distinction   | Small "EN"/"ET" labels                         | Tonal background shift                       |
| 9   | Marginalia label              | "originaal" (Estonian only)                    | Bilingual "original · originaal"             |
| 10  | Fetch granularity             | Per-chapter lazy (IntersectionObserver)        | Batch all on load                            |
| 11  | Marginalia expand-to-metadata | In Plan 2 (read-only feature)                  | Defer to Plan 3                              |

(_BB:Plantin_)
