# v1-Editor Design Spec

**Date:** 2026-04-17
**Milestone:** 3 (v1-editor)
**Scope:** Authenticated inline editing of Estonian paragraphs with direct commits to `main`.
**Out of scope:** Comments (deferred to v2), PR-based workflow, English text editing.

## Problem

The bigbook bilingual reader displays the AA Big Book in English and Estonian side by side. Anonymous visitors can read. The next milestone adds editing — authenticated GitHub collaborators should be able to correct and improve the Estonian translation directly from the reader, with each edit becoming a commit on `main`.

## Auth Foundation

Authentication is fully implemented and deployed (sessions 1–2):

- **PKCE OAuth** via GitHub App (`bigbook-dev`, client ID `Iv23lipPWHpw0QWj8lYF`)
- **Cloudflare Worker** token-exchange proxy at `bigbook-auth-proxy.mihkel-putrinsh.workers.dev`
- **Token persistence:** access token in-memory (~8h), refresh token in `localStorage` (~6 months, rotating)
- **UI:** Sign-in button in TopBar, avatar + sign-out when authenticated
- **Modules:** `src/lib/auth/github-app.ts`, `token-store.ts`, `pkce.ts`, `state.ts`, `config.ts`

The editor builds on this foundation — `token-store.ts` provides the access token for Contents API calls.

## Interaction Design

### Reading Mode (authenticated)

When a logged-in user hovers over an Estonian paragraph, a small pencil icon (✎) appears in the top-right corner of the ET column. Anonymous visitors never see the icon.

### Entering Edit Mode

Clicking the pencil icon replaces the paragraph text with a `<textarea>` pre-filled with the current Estonian text. The EN column remains visible as reference. The textarea gets focus automatically.

### Clean Edit State

When the textarea is open but the text has not been modified:

- No buttons are shown (Salvesta/Tühista appear only on dirty state)
- Other paragraphs remain active — clicking another paragraph's pencil icon closes the current textarea and opens the new one
- Pressing Escape closes the textarea and returns to reading mode

### Dirty State and Page Lock

When the textarea content differs from the original text:

- `Salvesta` and `Tühista` buttons appear below the textarea
- All other paragraph rows are visually dimmed (`opacity: 0.4`) and non-interactive (`pointer-events: none`)
- The pencil icon on other paragraphs is hidden
- Clicking outside the edit area does NOT cancel — only the explicit `Tühista` button reverts the edit
- If the user reverts the text to match the original, the buttons disappear and the page lock is released (back to clean edit state)

### Saving

Clicking **Salvesta**:

1. Reconstruct the full chapter markdown file with the edited paragraph replacing the original
2. Base64-encode the file content
3. `PUT /repos/mitselek/bigbook/contents/src/content/et/{chapter}.md` with:
   - `content`: base64-encoded file
   - `sha`: the blob SHA from when the chapter was loaded
   - `message`: auto-generated, e.g. `Muuda ch05-p003 (et)` (no user input required)
   - `committer`: GitHub user from the authenticated session
4. On success (200/201): exit edit mode, update the displayed text, update the stored SHA
5. The edit is live after the ~5-minute `raw.githubusercontent.com` CDN cache expires

### Cancelling

Clicking **Tühista**: revert the textarea to the original text, exit edit mode, unlock the page. No API call.

### Conflict Detection

If the `PUT` returns **409 Conflict** (another user edited the same file since this session loaded it):

1. The textarea becomes read-only with a red border
2. An error banner appears: _"Seda lõiku on vahepeal muudetud. Sinu muudatused on alles — kopeeri tekst ja laadi leht uuesti."_
3. Two buttons: **Sulge** (dismiss, lose edits) and **Kopeeri ja laadi uuesti** (copy textarea to clipboard, then reload page)

### UI Language

All editor UI elements (buttons, labels, error messages) are in Estonian.

## Data Flow

```
User clicks pencil
  → textarea appears (pre-filled with current ET text)
  → user edits text
  → Salvesta button appears (dirty state)
  → user clicks Salvesta
  → reconstruct full chapter .md file
  → PUT /repos/.../contents/src/content/et/{chapter}.md
      headers: Authorization: Bearer <access_token>
      body: { content: base64(file), sha: <blob_sha>, message: "Muuda {para-id} (et)" }
  → 200/201: update local state, exit edit mode
  → 409: show conflict banner, preserve user text
  → 401: attempt token refresh, retry once, then show auth error
```

## Architecture

### New Modules

| Module                              | Layer      | Purpose                                                           |
| ----------------------------------- | ---------- | ----------------------------------------------------------------- |
| `src/lib/editor/commit.ts`          | lib        | Reconstruct chapter file, PUT to Contents API, handle responses   |
| `src/lib/editor/state.svelte.ts`    | lib        | Editor state: `editingParaId`, `isDirty`, `isSaving`, `conflict`  |
| `src/components/EditableRow.svelte` | components | Wraps ParagraphRow with edit capabilities for authenticated users |

### Modified Modules

| Module                                 | Change                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/ParagraphRow.svelte`   | Accept optional `onEdit` callback prop; show pencil icon when provided                                                                                 |
| `src/components/ChapterSection.svelte` | Pass edit handler to ParagraphRow when user is authenticated; hold chapter blob SHA for commits                                                        |
| `src/lib/reader/store.svelte.ts`       | Add `isAuthenticated` flag to `readerState`                                                                                                            |
| `src/lib/content/fetch.ts`             | Restore `fetchCurrentEt` (Contents API path) for authenticated users — needed for blob SHA. Anonymous readers continue using `fetchCurrentEtFromMain`. |

### Contents API Integration

Authenticated users need the Contents API for two reasons:

1. **Blob SHA** — required for the `PUT` request's `sha` field
2. **Etag caching** — authenticated requests get 5000/hr rate limit, so the IndexedDB etag/SHA caching (`idb.ts`) becomes useful

When authenticated, `ChapterSection.load()` switches from `fetchCurrentEtFromMain()` to `fetchCurrentEt(slug, { etag, token })`. The access token comes from `token-store.ts`.

### File Reconstruction

The editor edits a single paragraph, but the Contents API operates on whole files. The commit module must:

1. Parse the current chapter file to extract all paragraphs
2. Replace the edited paragraph's text
3. Reassemble the file with frontmatter, `::para` directives, and paragraph text
4. Base64-encode and PUT

The reassembly must preserve the exact file structure — frontmatter, blank lines, directive format — to avoid spurious diffs. The existing `parse.ts` handles reading; the commit module adds the inverse (serialize).

### Hard Invariant Preservation

The editor only modifies paragraph _text_, never paragraph _structure_. It cannot:

- Add, remove, or reorder `::para` directives
- Change para-ids
- Split or merge paragraphs

This makes the Hard Invariant (every EN para-id paired with exactly one ET para-id) trivially preserved — the edit operation cannot violate it.

## Error Handling

| Scenario      | Response                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| PUT 200/201   | Success — update local state, exit edit mode                                                 |
| PUT 409       | Conflict — show banner, preserve text, offer copy+reload                                     |
| PUT 401       | Token expired — refresh via Worker, retry once. If still 401, show "Palun logi uuesti sisse" |
| PUT 404       | File deleted — show "Faili ei leitud. Palun laadi leht uuesti."                              |
| PUT 422       | Validation error — show raw error message                                                    |
| Network error | Show "Võrguühendus puudub. Sinu muudatused on alles." with retry button                      |

## Testing Strategy

- **`src/lib/editor/commit.ts`** — unit tests: file reconstruction, API call parameters, error mapping
- **`src/lib/editor/state.svelte.ts`** — unit tests: state transitions (idle → editing → dirty → saving → done)
- **`src/components/EditableRow.svelte`** — component tests: pencil visibility, textarea activation, button appearance on dirty, dimming of siblings
- **E2E** — Playwright: full edit flow with mocked GitHub API

Coverage gates: `src/lib/editor/` at ≥ 90% lines/functions/statements, ≥ 85% branches (same as `src/lib/`).

## Mobile Considerations

On mobile (<900px), the bilingual columns stack vertically. The edit flow adapts:

- Pencil icon appears in the top-right of the ET block (same position, stacked layout)
- Textarea fills the full width
- Salvesta/Tühista buttons are full-width
- The EN reference block above remains visible but is not scrolled to automatically

## Security

- Access tokens are never persisted to disk — in-memory only, cleared on page reload
- The `PUT` request includes the user's access token; GitHub attributes the commit to the authenticated user
- No `innerHTML` or `{@html}` in the editor UI — all user input goes into a `<textarea>`, which is inherently safe from XSS
- The editor cannot modify EN content or file structure — only ET paragraph text within existing para-ids

(_BB:Plantin_)
