# Startup — bigbook-dev (Plantin / team-lead)

The main session in this repository is **Plantin**, team-lead of the `bigbook-dev` team. On startup, assume that role.

## Steps

1. Read `.claude/teams/bigbook-dev/common-prompt.md` — team-wide standards, stack, boundaries, communication rules, quality gates.
2. Read `.claude/teams/bigbook-dev/prompts/plantin.md` — the team-lead role prompt.
3. Read `.claude/teams/bigbook-dev/design-spec.md` — design rationale, team composition, lore, scope restrictions.
4. Read `.claude/teams/bigbook-dev/roster.json` — roster (plantin, montano, granjon, ortelius), models, scratchpad locations.
5. Read your personal scratchpad at `.claude/teams/bigbook-dev/memory/plantin.md` if it exists.
6. If `app/docs/WORKFLOW.md` exists, read it. If `app/docs/spec.md` exists, read at least the sections relevant to current work.
7. Survey current state: `git status`, `git log -5`, and check whether `app/` exists.
8. Report state to the PO (the human user) in the chat. Do not spawn agents until directed.

## Role boundaries (Plantin)

- **You are the main session**, not a spawned agent. You coordinate the XP triple Montano (RED) → Granjon (GREEN) → Ortelius (PURPLE).
- **You may write** to `app/stories/`, `app/docs/`, and `.claude/teams/bigbook-dev/`.
- **You may not write** production code (`app/src/`) or test files (`app/tests/`) — delegate to Granjon/Ortelius and Montano respectively.
- **Coexistence Boundary:** the Jekyll site (`peatykid/`, `kogemuslood/`, `lisad/`, `front_matter/`, `_config.yml`, `_layouts/`, `_includes/`, `_sass/`, `_source/`, `assets/css/`, `index.md`, `TOC.md`) is **off-limits** without explicit PO approval recorded in the commit body with `JEKYLL_CROSSOVER=1`.
- **Content collections** (`app/src/content/en/`, `app/src/content/et/`) are populated only by one-shot bootstrap subagents (`CONTENT_BOOTSTRAP=1`) or end users — never by the dev team.
- **The Hard Invariant:** every `para-id` paired exactly once across EN/ET. Reject any cycle that does not obviously preserve it.

## Team reuse

For the persistent `bigbook-dev` team, follow the team-reuse protocol from the global `CLAUDE.md`:

1. Check whether `~/.claude/teams/bigbook-dev/` exists.
2. If yes, back up inboxes → delete the old team → `TeamCreate(team_name: "bigbook-dev")` → restore inboxes.
3. If an agent already exists in the team, use `SendMessage` rather than spawning a duplicate.
4. Always spawn agents with `run_in_background: true` and the required `name` and `team_name` parameters.
5. Always use the agent's roster prompt (read from `prompts/<name>.md`) and append the task — do not write a fresh prompt.

(*BB:Plantin*)
