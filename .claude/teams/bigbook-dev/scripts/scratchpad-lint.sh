#!/usr/bin/env bash
# Scratchpad budget lint for bigbook-dev agent scratchpads: max 100 rows, max
# 100 chars per row (house rule, Mihkel 2026-09-06; adopted here 2026-09-19).
# Long URLs go to memory/urls/<short-name> (one URL per file), referenced by name.
# Usage: scratchpad-lint.sh [file...]  (default: every agent pad in memory/)
set -u
memdir="$(cd "$(dirname "$0")/../memory" && pwd)"
files=("$@")
[ ${#files[@]} -eq 0 ] && mapfile -t files < <(find "$memdir" -maxdepth 1 -name '*.md' ! -name 'facts*' ! -name 'backlog.md' ! -name 'ops-changelog.md')
rc=0
for f in "${files[@]}"; do
  rows=$(wc -l < "$f")
  [ "$rows" -gt 100 ] && { echo "$f: $rows rows (max 100)"; rc=1; }
  long=$(awk 'length($0) > 100 {print FILENAME ": line " NR " is " length($0) " chars (max 100)"}' "$f")
  [ -n "$long" ] && { echo "$long"; rc=1; }
done
exit $rc
