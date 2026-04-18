# bigbook

**bigbook** is a bilingual reader for Alcoholics Anonymous's "Big Book" (_Anonüümsed Alkohoolikud_, 4th edition). English on the left, Estonian on the right. Anonymous visitors read. GitHub-authenticated collaborators edit the Estonian text and leave comments. Every change is a commit against this repository.

Live at [https://mitselek.github.io/bigbook/](https://mitselek.github.io/bigbook/).

## Audience

The Estonian-speaking AA community and the volunteers maintaining the Estonian translation of the 4th edition. The existing Estonian-only Jekyll archive at [https://mitselek.github.io/bigbook/legacy/](https://mitselek.github.io/bigbook/legacy/) served this community for years; the new app adds the English original beside every paragraph and lets collaborators correct and improve the translation together.

## Where to read next

- **Design spec** — [`docs/superpowers/specs/2026-04-14-bigbook-reader-design.md`](./superpowers/specs/2026-04-14-bigbook-reader-design.md). The full product and engineering spec: reader UX, editor UX, auth, error handling, quality gates, testing strategy.
- **Architecture** — [`docs/architecture.md`](./architecture.md). Three-layer boundary, runtime content fetch, the hard invariant.
- **Deployment** — [`docs/deploy.md`](./deploy.md). GitHub Pages pipeline, workflow jobs, verification URLs.
- **Legacy archive** — [`docs/legacy.md`](./legacy.md). Why the pre-restructure Jekyll site is preserved under `legacy/` and how inbound links are handled.
- **Contributing** — [`docs/WORKFLOW.md`](./WORKFLOW.md). The RED/GREEN/PURPLE TDD discipline used in this codebase.

## Scope in one line

A thin Astro shell that fetches chapter markdown at runtime from this repository; anonymous reads via `raw.githubusercontent.com`; authenticated edits via the GitHub Contents API; versioning through commits against `main`.

(_BB:Plantin_)
