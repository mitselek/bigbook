#!/usr/bin/env bash
# content-guard — block staged diffs under src/content/ unless
# CONTENT_BOOTSTRAP=1 is set.
#
# Rationale: src/content/ is populated by the one-shot bootstrap script
# (scripts/bootstrap-mock-content.ts) and by end users via the web app.
# The dev team never commits content directly. This hook catches
# accidental dev-team commits that would clobber user data.
#
# Exit 0 = allow commit, exit 1 = block.

set -euo pipefail

content_files=()
for file in "$@"; do
  if [[ "$file" == src/content/* ]]; then
    content_files+=("$file")
  fi
done

if [[ ${#content_files[@]} -eq 0 ]]; then
  exit 0
fi

if [[ "${CONTENT_BOOTSTRAP:-0}" == "1" ]]; then
  echo "content-guard: CONTENT_BOOTSTRAP=1 set, allowing ${#content_files[@]} staged file(s) under src/content/"
  for file in "${content_files[@]}"; do
    echo "  $file"
  done
  exit 0
fi

echo "content-guard: refusing to commit staged files under src/content/ without CONTENT_BOOTSTRAP=1" >&2
echo "Staged files under src/content/:" >&2
for file in "${content_files[@]}"; do
  echo "  $file" >&2
done
echo "" >&2
echo "src/content/ is owned by the bootstrap script and end users, not the dev team." >&2
echo "If this is a legitimate content-bootstrap commit, re-run with:" >&2
echo "  CONTENT_BOOTSTRAP=1 git commit ..." >&2
exit 1
