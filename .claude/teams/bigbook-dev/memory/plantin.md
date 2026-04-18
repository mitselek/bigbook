# Plantin — Scratchpad

## Project Timeline

| Sessions | Milestone | What landed |
|---|---|---|
| 1–2 | Pre-bootstrap | Coexistence inversion (Jekyll → `legacy/`, repo root → Astro), dual-build GH Actions workflow, auth PoC (GitHub App PKCE + CF Worker token proxy) |
| 3 | Planning | Product brainstorm → spec (`2026-04-14-bigbook-reader-design.md`), v1-foundation plan (7 phases, 36 tasks), GitHub milestones + epics + sub-issues |
| 4 | v1-foundation P0 | Infrastructure: Svelte 5, a11y ESLint, Playwright scaffold, size-limit scaffold |
| 5 | v1-foundation P1 | `parse.ts` — 115 lines, 12 tests, 100% coverage. XP triple first live exercise. |
| 6 | v1-foundation P2+P3 | `validate.ts` (88 lines) + `diff.ts` (23 lines). `.gitattributes` LF enforcement. |
| 7 | v1-foundation P4 | `scripts/bootstrap-mock-content.ts` — 268 lines, 6 pure helpers + orchestrator. Mixed-mode (inline + XP triple). |
| 8 | v1-foundation P5+P6 | Pre-commit hooks (legacy-guard restored, content-guard, hard-invariant). Mock content bootstrap (16 chapters, 731 para pairs). **v1-foundation CLOSED.** |
| 9 | Plan 2 writing | v1-reader brainstorm (visual companion + 11 decisions) → spec → plan (8 phases, 38 tasks). No agents spawned. |
| 10 | **v1-reader (full)** | All 8 phases (P0–P7) + 3 post-closure hotfixes. 52 commits, 89 unit/component tests + 4 Playwright E2E. **v1-reader CLOSED.** |
| 11 | **v1-editor + polish** | Polish: reading position dot, TOC force-load, markdown rendering (marked), rate-limit fix, return-visit scroll. Editor: brainstorm → spec → plan → implementation (7 tasks via subagent-driven). ET content corrections ch05–ch11 from PDF. **116 tests.** |
| 12 | **v1-editor close-out + v1-ship + v1.0.0 release** | Inline-bug blitz (md gotcha, arrow keys, burger nuke, Estonian top-bar, editor UX, focus observer, auth sync). v1-editor gap fixes (#26–#28, #30) + 4 Playwright editor E2E scenarios (#29). v1-ship: real size-limit budgets, CI quality gates (typecheck/lint/test/size + Playwright matrix), docs/WORKFLOW.md + docs/spec.md. **v1-editor, v1-ship CLOSED. Tagged `v1.0.0`, GitHub Release published.** |

## Current State (after session 12)

- **Head of `main`:** `06af659` (`docs: add WORKFLOW.md and spec.md pointer doc`). Tagged **`v1.0.0`**. CI green. Deployed.
- **v1-foundation:** CLOSED (milestone 1, epic #3).
- **v1-reader:** CLOSED (milestone 2, epic #4).
- **v1-editor:** **CLOSED** (milestone 3, epic #5, sub-issues #25–#30). PO validated the edit flow in production by landing `6f17bb2 Muuda ch09-perekond-hiljem-p027 (et)` during session 12.
- **v1-ship:** **CLOSED** (milestone 4, epic #6, sub-issues #31–#34). P5 revised: cross-browser coverage satisfied by automated Playwright matrix (chromium + firefox + webkit) on push to `main`; real-device manual verification deferred post-v1 per PO decision ("address compatibility issues as they appear").
- **Live site:** `https://mitselek.github.io/bigbook/` · **Release:** `https://github.com/mitselek/bigbook/releases/tag/v1.0.0`
- **`src/lib/content/`:** 9 modules — parse, serialize, validate, diff, manifest, baseline-config, fetch, plus `editor/preflight.ts` and `editor/commit-with-retry.ts` added session 12.
- **`src/lib/editor/`:** 4 modules — state.svelte.ts, commit.ts, **preflight.ts** (new), **commit-with-retry.ts** (new).
- **`src/lib/reader/`:** 4 modules — scroll-anchor, local-state, store.svelte, idb.
- **`src/lib/auth/`:** 5 modules — github-app (now exports `tryRefreshAccessToken`), token-store, pkce, state, config.
- **`src/components/`:** 8 components — TopBar (mobile-wordmark, burger removed, ET-only title, Sisene/Lahku labels), TopBarClient, ChapterSection (diff recompute after save, auth-expired signout, focus observer reacts to editingParaId, baseline-failure graceful degrade), ParagraphRow (md sentinel escape), EditableRow (document-level Esc/click-outside/Ctrl+Enter), Marginalia, TocOverlay, Footer.
- **`src/content/{en,et}/`:** 16 chapter pairs, 731 paragraphs. EN ch01–ch04 real English; ch05–ch16 ET-verbatim placeholders. ET ch05–ch11 corrected against authoritative PDF. ET ch09-p027 edited by PO via the live editor session 12 (`6f17bb2`).
- **`tests/`:** **142 Vitest tests** (unit + component) all passing, **8 Playwright E2E tests** (4 editor scenarios + 4 reader scenarios) all passing.
- **CI:** full quality gate + Playwright matrix enforced on every PR and every push to `main`.
- **Team state:** no persistent team in `~/.claude/teams/bigbook-dev/` this session — all work went through one-shot subagents.

## Session 12 Work Summary

### Inline bug blitz (pre-milestone)

- **`c773a98`** md gotcha — year-start paragraphs in markdown (`1929. aastal…`) were parsing as `<ol start="1929">`. The `<not-a-list/>` sentinel was only being stripped, not neutralizing the trigger. Fix: replace sentinel-plus-digits with escaped-period form (`<not-a-list/>1929.` → `1929\.`). 5 new component tests.
- **`c5f49e7`** arrow-key nav — dropped the prev/next chapter buttons from TopBar; `←`/`→` now scroll between chapters via a document-level `keydown` handler that guards against modifier keys and editable targets. Subagent scope-crept by consolidating the `/` TOC handler into the same listener — accepted.
- **`7af1428`** burger nuke — removed the mobile burger dropdown entirely. Astro was silently duplicating the `<slot name="auth" />` into both desktop and mobile slots; `document.getElementById('signin-btn')` only found the first (desktop, hidden on mobile) → the login button had been invisible on mobile since it shipped. Single `.top-bar-right` visible on both viewports now.
- **`185f442`** Estonian top-bar polish — wordmark collapses to "BB" under 899px; center title renders ET-only (no EN + separator); auth labels localized ("Sisene"/"Lahku"); avatar with `{login}` text fallback.
- **`19262bf`** editor UX — Esc and outside-click now exit a clean editor (no-op when dirty). Handler moved off the textarea onto `document`; `queueMicrotask` delay + `editingParaId === paraId` guard defend against the pencil-swap race between paragraphs.
- **`2136e37`** focus-observer bug — the 1/3-viewport reading-position dot was skipping paragraphs that had been edited. `ChapterSection`'s `$effect` watches `.paragraph-row` DOM nodes; when edit mode swaps them the observer was orphaned. Fix: read `editorState.editingParaId` inside the `$effect` so every edit-mode transition re-attaches the observer to the current `.paragraph-row` set.

### v1-editor gap fixes (sub-issues of epic #5)

- **#25 `8c402b9`** — signout now syncs `readerState.isAuthenticated = false`. `handleSave`'s `auth_expired` branch does the same before showing the "Palun logi uuesti sisse" message, so the editor UI stops trapping the user after a dead session.
- **#26 `03f00d4`** — `Ctrl/Cmd+Enter` commits the edit. 5 new tests.
- **#27 `5cfc9f0`** — pre-flight validation wired. New pure helper `src/lib/editor/preflight.ts`; `handleSave` calls it before firing the PUT, short-circuits with `commitError('Valideerimisviga: …')` on `!ok`. **Key finding:** because `replaceParaText` round-trips through parse+serialize, it cannot corrupt the para-id set through normal text editing — the only realistic trigger for pre-flight failure is a user pasting a raw `::para[id]` directive into the body. The gate is still correct; just narrower than the threat model implied.
- **#28 `f9b8ecc`** — §3.6 gaps: (a) 401 silent refresh on commit via new `src/lib/editor/commit-with-retry.ts` pure helper that injects `commit`, `refresh`, `getToken` callbacks for test isolation; (b) baseline fetch/parse failure degrades to empty `ParsedChapter` instead of hard-blocking the chapter.
- **#30 `e1cf287`** — P7 marginalia recompute after save. `handleSave` re-parses the new `currentEt` + baseline, runs `diffCurrentVsBaseline`, updates `paragraphs[idx].isDiverged` and `baselineEtText`. Discovered while strengthening the P10a E2E test.

### v1-editor P10 Playwright E2E (issue #29)

All four scenarios landed, each as a separate test file + one commit, shared fixtures module at `tests/e2e/fixtures/editor-e2e.ts`:

- **P10a `4363704`** + strengthened `e1cf287` — happy path + fixtures module (setupSignedInSession, setupChapterContent, interceptCommit, makeBilingualChapter, ~432-line helper). Pencil click must use `dispatchEvent('click')`, not `locator.click()`, because the document-level click-outside guard races with Playwright's pointer sequence.
- **P10b `198c80a`** — 409 conflict recovery. Asserts conflict banner surfaces, textarea goes readonly, action buttons swap, user stays signed in. Does NOT click "Kopeeri ja laadi uuesti" (it reloads the page).
- **P10c `641c00b`** — 401 silent refresh + retry. Counter-closure sequences the PUT responses (first 401, then 200). Asserts PUT fires exactly twice, `/refresh` fires between them, editor closes cleanly, user never sees a signed-out state.
- **P10d `9452757`** — pre-flight rejection. Types a bogus `::para[ch99-p999]` directive into the textarea. Asserts PUT is NEVER called, "Valideerimisviga:" error banner surfaces, editor stays open with user's typed text preserved.

### v1-ship (sub-issues of epic #6)

- **#31 `2ca7a18`** — measured real size-limit budgets (JS ~39 kB brotlied → limit 80 kB; HTML ~7 kB brotlied → limit 15 kB), wired the CI `quality` job (typecheck + lint + test + build + size) on every PR and every push to `main`. Deploy jobs gated on `push to main`. **Side win:** fixed 5 pre-existing `localStorage.clear is not a function` failures in `tests/lib/reader/local-state.test.ts` by shimming `window._localStorage` over Node 25's native binding in `tests/setup.ts`.
- **#32 `7e0490f`** + **`f8db2b6`** — Playwright CI job. Single job with event-conditional steps: chromium only on PR, full matrix (chromium + firefox + webkit) on push to `main`. Playwright reports upload as artifacts on failure. Exposed (and fixed) a pre-existing silent failure in `reader.spec.ts` — `.wordmark` assertion now uses `{ useInnerText: true }` to respect `display:none`.
- **#33 + #34 `06af659`** — `docs/WORKFLOW.md` (role-neutral RED/GREEN/PURPLE discipline) + `docs/spec.md` (short user-facing pointer doc). I wrote both directly (Plantin territory, no subagent needed).

### v1-ship P5 revision

PO scope decision: real-device manual verification on Safari (macOS + iOS) and Firefox desktop is **deferred post-v1**. Automated Playwright matrix on push to `main` provides cross-engine coverage; platform-specific issues will be handled reactively as they surface. Epic #6 body revised, P5 ticked under the revised wording.

### v1.0.0 release

- Release notes drafted inline, reviewed by PO before publication.
- Tag `v1.0.0` created on `main` at `06af659` via `gh release create --target main`.
- GitHub Release published at <https://github.com/mitselek/bigbook/releases/tag/v1.0.0>.
- Epic #6 and milestone v1-ship closed.

## Open Items (post-v1)

Things intentionally deferred — none of them block v1 or block further reactive work:

- **Real-device cross-browser verification** — Safari (macOS + iOS), Firefox desktop. Handled reactively per PO scope decision.
- **EN ch05–ch16 content extraction** — still ET-verbatim placeholders. Session 11 subagents failed at greenfield PDF-to-markdown extraction. Needs a different approach (manual, dedicated script, or different LLM shape).
- **v2 comments feature** — logged-in-only paragraph comments. Explicit v2 scope per editor spec.
- **Auth ADR** at `docs/decisions/0001-auth.md` — scope decisions around GitHub App config, scopes, refresh cadence, XSS mitigations. Deferred since session 2.
- **Node 20 → 24 GH Actions migration** — deadline June 2026.
- **`npm audit` moderate advisories** — 11+ from Astro scaffold + deps.
- **ch05/ch06 structural mismatch** with authoritative Estonian PDF chapter boundaries (content between p010–p011 is missing from ch05, and ch06 has duplicates from ch05).

## Session 12 Lessons

- **Node 25 native `localStorage` shadows jsdom's in Vitest.** Node 25 ships `localStorage` natively as part of the `--localstorage-file` feature; the native object lacks `.clear()` and blocks jsdom from taking over the global. Fix in `tests/setup.ts`: reassign `globalThis.localStorage = window._localStorage` at startup. Saved to auto-memory (`node25_jsdom_localstorage.md`).
- **Playwright `locator.click()` races with Svelte 5's microtask-deferred document listeners.** Specifically, the click-outside guard in `EditableRow.svelte` is armed via `queueMicrotask`; Playwright's full pointer sequence (pointerdown → mousedown → pointerup → mouseup → click) races it and cancels the edit that was just opened. Workaround: `dispatchEvent('click')` for the pencil. Salvesta/Tühista clicks inside the editor are unaffected. Saved to auto-memory (`playwright_svelte5_gotchas.md`).
- **Playwright CI runs against `npm run preview`, not a live dev server.** Code changes to `src/` require `npm run build` before `npx playwright test`. Symptom: test still fails against the stale build artifact after you fix the production code. Saved to same auto-memory file.
- **`gh`/snap confinement is narrower than `$HOME`.** Confirmed this session: body files at `$HOME` root (`/home/michelek/.foo.md`) fail with "permission denied". Must live inside the repo working tree. Updated the existing `host_gh_snap_tempfiles.md` auto-memory entry.
- **Playwright's `toHaveText` uses `textContent`, not `innerText`.** Hidden spans count. Desktop assertions that rely on visibility need `{ useInnerText: true }`. Broke `reader.spec.ts` silently when the mobile wordmark collapse introduced a `display:none` span — didn't surface until Playwright went into CI.
- **`sub_issues_summary` caching lags ~several seconds** behind actual sub-issue closures. `gh api repos/.../issues/N --jq '.sub_issues_summary'` can return stale `completed` counts immediately after closing an issue. Wait a beat and re-query; don't panic.
- **Epic-check-box updates via `sed`** on the fetched body work cleanly: `gh issue view N --json body --jq '.body' > tmp && sed -i 's/- \[ \] \*\*P/- [x] **P/g' tmp && gh issue edit N --body-file tmp`. Used this to bulk-tick v1-editor and v1-ship phases.
- **Parallel subagents on independent test files don't conflict.** Dispatched P10b, P10c, P10d in parallel; each wrote a different spec file, none touched the fixtures module; all three commits serialized cleanly through the git index lock. Don't do this when agents might modify the same file.
- **CI surfaces silent breaks.** The CI gate wiring this session caught two pre-existing silent failures (`local-state.test.ts` localStorage, `reader.spec.ts` wordmark) that had been sitting in the tree unnoticed. Confirms the value of gating early and aggressively.

## Reorientation for next session

**You are Plantin, team-lead of `bigbook-dev`.** The main session in this repo assumes that role on startup (see `.claude/startup.md`).

**v1 is SHIPPED.** Tag `v1.0.0`, GitHub Release published, all four milestones closed (v1-foundation, v1-reader, v1-editor, v1-ship). Live at <https://mitselek.github.io/bigbook/>. CI green. No team was persisted from session 12 — start fresh if you spawn one.

**Default state at session open:**
1. `git status` should show a clean tree on `main`, up-to-date with `origin/main`, tip at `06af659` tagged `v1.0.0` (unless PO pushed more since).
2. `gh run list --limit 1` should show the most recent CI run green.
3. `gh issue list --state open` will show whatever bugs have surfaced reactively since session 12.

**Natural next directions** — all PO-owned; surface the menu, let PO pick:
- **Reactive bug triage.** Any issues that appeared since shipping (check `gh issue list`). Address as one-shot subagent hotfixes — the pattern worked well all of session 12.
- **v2-comments milestone.** Explicit post-v1 scope from the editor spec. Would need brainstorm → spec → plan → GitHub milestone setup before execution. Likely a full-team XP cycle, not subagent-driven, because it's greenfield production code (comments data model, rendering, auth gating, signed-in-only visibility, GitHub Issues API or separate content collection).
- **EN ch05–ch16 content extraction.** Still ET-verbatim placeholders. Session 11 subagents failed at PDF-to-markdown extraction. Needs a different approach before tackling (manual extraction, a dedicated script, different LLM shape, or human-driven).
- **Real-device cross-browser verification.** Safari macOS/iOS, Firefox desktop. Per PO scope decision, handled reactively — only engage if PO raises a specific symptom.
- **Auth ADR** at `docs/decisions/0001-auth.md`. Documents the GitHub App configuration in full. Not blocking anything, but worth tackling if there's a quiet session.
- **Node 20 → 24 migration.** Deadline June 2026 — plenty of time. Low priority unless the Node 20 runner is about to be removed.

**Session 12 operating patterns that worked:**
- **One-shot subagents chained serially** handled every bug fix and E2E test this session cleanly.
- **Parallel subagents** worked when each touched independent files (the three P10 tests). Don't parallelize when shared state is in play.
- **Sonnet was sufficient** for every implementation task. No opus needed for the bug-fix pattern.
- **File sub-issues for every gap**, link as sub-issues of the relevant epic, use `Part of #X` / `Closes #Y` in commits — keeps the paper trail tight.

**Critical gotchas to remember (all saved in auto-memory at `~/.claude/projects/.../memory/`):**
- `gh`/snap confinement: body files must live inside the repo working tree, never `/tmp/` or `$HOME` root.
- Node 25 + Vitest + jsdom: `localStorage` shim in `tests/setup.ts` required.
- Playwright + Svelte 5 editor: `dispatchEvent('click')` for the pencil, not `locator.click()`.
- Playwright CI uses preview not dev: rebuild before running tests locally.
- Playwright `toHaveText` uses `textContent` (includes hidden) — use `{ useInnerText: true }` for visibility-respecting assertions.

**If PO hands you a specific task**, dispatch a one-shot subagent with:
- Test-first discipline (invoke `tdd-bugfix` or `superpowers:test-driven-development`).
- Explicit scope (files that MAY and MAY NOT be touched).
- Commit message template with `Part of #<epic>` + `Closes #<issue>` footers.
- `(*BB:<Role>*)` attribution.
- Instruction to NOT push — Plantin reviews and pushes.

Welcome back. Good luck.

(*BB:Plantin*)
