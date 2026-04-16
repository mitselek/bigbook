# P2 — Page Skeleton

**Phase goal:** Rewrite `index.astro` as the reader page, create static Astro components (TopBar, Footer), and render a full-book skeleton from `manifest.ts`. After this phase, the deployed site shows the correct page structure with blank rows for every paragraph — no runtime fetch yet.

**Execution mode:** Inline (Plantin)

**Files:**

- Create: `src/components/TopBar.astro`
- Create: `src/components/Footer.astro`
- Modify: `src/pages/index.astro` (rewrite from auth PoC to reader page)
- Modify: `src/layouts/BaseLayout.astro` (if needed for reader-specific head tags)

---

## Task P2.1 — Footer.astro

- [ ] Create `src/components/Footer.astro`:

```astro
---
// Static footer — no props, no client JS
---

<footer class="reader-footer">
  <hr />
  <p>
    hosted on GitHub ·
    <a href="https://github.com/mitselek/bigbook" target="_blank" rel="noopener">
      github.com/mitselek/bigbook
    </a>
  </p>
</footer>

<style>
  .reader-footer {
    padding: 16px 20px;
    text-align: center;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 12px;
    color: #999;
  }
  .reader-footer hr {
    border: none;
    border-top: 1px solid #e0ddd8;
    margin: 0 0 12px;
  }
  .reader-footer a {
    color: #0969da;
    text-decoration: none;
  }
  .reader-footer a:hover {
    text-decoration: underline;
  }
</style>
```

- [ ] Verify: `npm run build` succeeds.
- [ ] **Commit:** `feat(components): P2.1 — Footer.astro`

---

## Task P2.2 — TopBar.astro (static shell)

- [ ] Create `src/components/TopBar.astro`. Static for now — the reactive title update (TopBarClient.svelte) lands in P5 when the IntersectionObserver is wired.

```astro
---
// Static top bar. Center title is a placeholder until P5 wires
// the reactive TopBarClient.svelte island.
---

<header class="top-bar">
  <div class="top-bar-left">
    <a href="/bigbook/" class="wordmark">bigbook</a>
  </div>
  <div class="top-bar-center" id="top-bar-title">
    <!-- P5 replaces this with TopBarClient.svelte -->
    <span class="title-placeholder"></span>
  </div>
  <div class="top-bar-right">
    <button class="nav-arrow" id="prev-chapter" aria-label="Previous chapter">◀</button>
    <button class="nav-arrow" id="next-chapter" aria-label="Next chapter">▶</button>
    <slot name="auth" />
  </div>
</header>

<style>
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 16px;
    background: #fff;
    border-bottom: 1px solid #e0ddd8;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    color: #444;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .wordmark {
    font-weight: 600;
    font-size: 15px;
    color: #222;
    text-decoration: none;
  }
  .top-bar-center {
    text-align: center;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    flex: 1;
    padding: 0 12px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .top-bar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .nav-arrow {
    background: none;
    border: none;
    cursor: pointer;
    color: #888;
    font-size: 14px;
    padding: 4px;
  }
</style>
```

- [ ] Verify: `npm run build` succeeds.
- [ ] **Commit:** `feat(components): P2.2 — TopBar.astro static shell`

---

## Task P2.3 — Rewrite index.astro as reader page with skeleton

- [ ] Rewrite `src/pages/index.astro`. Import `CHAPTERS` and height constants from manifest. Render TopBar, then one `<section>` per chapter with blank skeleton rows, then Footer.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import TopBar from '../components/TopBar.astro'
import Footer from '../components/Footer.astro'
import { CHAPTERS, ESTIMATED_HEIGHT_TITLE, ESTIMATED_HEIGHT_BODY } from '../lib/content/manifest'
---

<BaseLayout title="Big Book — Bilingual Reader">
  <TopBar>
    <!-- Auth affordance slot — existing session-2 auth UI goes here in P5 -->
  </TopBar>

  <main class="reader-body">
    {
      CHAPTERS.map((chapter) => (
        <section
          class="chapter-section"
          id={`chapter-${chapter.slug}`}
          data-chapter-slug={chapter.slug}
        >
          {chapter.paraIds.map((paraId) => (
            <div
              class={`skeleton-row ${paraId.endsWith('-title') ? 'skeleton-title' : 'skeleton-body'}`}
              id={paraId}
              style={`min-height: ${paraId.endsWith('-title') ? ESTIMATED_HEIGHT_TITLE : ESTIMATED_HEIGHT_BODY}px`}
            >
              <div class="skeleton-en" />
              <div class="skeleton-et" />
              <div class="skeleton-marginalia" />
            </div>
          ))}
        </section>
      ))
    }
  </main>

  <Footer />
</BaseLayout>

<style>
  .reader-body {
    background: #faf8f5;
    font-family: Georgia, 'Times New Roman', serif;
    padding: 0;
  }
  .skeleton-row {
    display: flex;
    border-bottom: 1px solid #eae7e2;
    padding: 12px 20px;
  }
  .skeleton-title {
    padding: 16px 20px;
  }
  .skeleton-en {
    width: calc((100% - 140px) * 0.45);
    padding-right: 16px;
    border-right: 1px solid #e0ddd8;
  }
  .skeleton-et {
    width: calc((100% - 140px) * 0.55);
    padding-left: 16px;
  }
  .skeleton-marginalia {
    width: 140px;
    padding-left: 12px;
  }
</style>
```

- [ ] Verify: `npm run build` succeeds, `npm run typecheck` clean.
- [ ] Open `dist/index.html` and confirm: correct number of skeleton rows (731 from manifest), each with an `id` attribute matching `para-id`, TopBar at top, Footer at bottom.
- [ ] **Commit:** `feat(reader): P2.3 — index.astro rewritten as skeleton reader`

---

## Task P2.4 — Preserve auth PoC in TopBar

- [ ] Move the existing auth PoC UI (sign-in button, avatar render) from the old `index.astro` into the TopBar's `<slot name="auth" />`. The auth JS logic in `src/lib/auth/` stays unchanged. The session-2 callback page at `src/pages/auth/callback.astro` stays unchanged.

The exact wiring depends on how the session-2 auth PoC was structured. Read `src/pages/index.astro` (the pre-rewrite version — check git for the original) and `src/lib/auth/` to understand the existing auth flow, then migrate the sign-in/avatar rendering into the TopBar's auth slot.

- [ ] Verify: `npm run build` succeeds. The auth callback flow should still work (sign in → redirect → callback → avatar renders).
- [ ] **Commit:** `feat(reader): P2.4 — auth affordance migrated to TopBar`

---

## Task P2.5 — Smoke test update

- [ ] Update `tests/smoke.test.ts` (or add a new test) to verify the rewritten index.astro builds correctly with the manifest data:

```ts
it('index.astro renders skeleton rows from manifest', async () => {
  // The existing smoke test likely just checks that the build succeeds.
  // If it imports or checks index.astro content, update it to match
  // the new reader structure. Otherwise, no change needed — the build
  // gate in P2.3 already verified the page builds.
})
```

- [ ] Verify: `npm run test` — all tests pass (42 existing + any updates).
- [ ] **Commit:** `test(reader): P2.5 — smoke test updated for reader skeleton`

---

## Phase-exit gate

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

Deployed site should show: TopBar → blank skeleton rows for all 731 paragraphs → Footer. No content yet — that comes in P5.

(_BB:Plantin_)
