#!/usr/bin/env bash
# legacy-guard — block staged diffs under legacy/ unless LEGACY_OVERRIDE=1.
#
# Lefthook passes the list of staged files as "$@". We check whether any of
# them are under the legacy/ prefix. If yes, we require the LEGACY_OVERRIDE=1
# environment variable AND a line in the commit message containing
# "legacy-override:" (enforced via a subsequent commit-msg hook — for now
# just document the expectation).
#
# Exit 0 = allow commit, exit 1 = block.

set -euo pipefail

legacy_files=()
for file in "$@"; do
  if [[ "$file" == legacy/* ]]; then
    legacy_files+=("$file")
  fi
done

if [[ ${#legacy_files[@]} -eq 0 ]]; then
  exit 0
fi

if [[ "${LEGACY_OVERRIDE:-0}" == "1" ]]; then
  echo "legacy-guard: LEGACY_OVERRIDE=1 set, allowing ${#legacy_files[@]} staged file(s) under legacy/"
  for file in "${legacy_files[@]}"; do
    echo "  $file"
  done
  echo "legacy-guard: reminder — record PO approval in the commit body."
  exit 0
fi

echo "legacy-guard: refusing to commit staged files under legacy/ without LEGACY_OVERRIDE=1" >&2
echo "Staged files under legacy/:" >&2
for file in "${legacy_files[@]}"; do
  echo "  $file" >&2
done
echo "" >&2
echo "If this change is PO-approved, re-run with:" >&2
echo "  LEGACY_OVERRIDE=1 git commit ..." >&2
echo "and record PO approval in the commit body." >&2
exit 1
