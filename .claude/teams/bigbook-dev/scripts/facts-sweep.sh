#!/usr/bin/env bash
# Weekly working set: oldest facts + stagnant stubs. Spec: designs/facts-memory-redesign.md
set -u
SDIR="$(cd "$(dirname "$0")" && pwd)"
cd "$(git -C "$SDIR" rev-parse --show-toplevel)"
. "$SDIR/facts.env"
dir="${1:-$FACTS_DIR}"
cutoff=$(date -d "-${QUARTER_NUM_OF_DAYS} days" +%F)
live=$(grep -lx 'status: live' "$dir"/*.md 2>/dev/null)
harvest() { # file:line:date for every fact in live files
  for f in $live; do
    grep -n '`v:[0-9-]*`' "$f" | sed -E "s|^([0-9]+):.*\`v:([0-9-]{10})\`.*|$f:\1:\2|"
  done
}
echo "## sweep"
harvest | sort -t: -k3 | awk -F: -v n="$SWEEP_NUM_OLDEST" -v c="$cutoff" 'NR<=n || $3<c' \
| while IFS=: read -r f l d; do
    sed -n "${l}p;$((l+1))p;$((l+2))p" "$f" | sed "1s|^|$f:$l  |"
  done
echo "## still-true"
# facts whose only refutation address is a human: rf: empty, or rf: =ev pointing at ev: mihkel
harvest | sort -t: -k3 | while IFS=: read -r f l d; do
    ev=$(sed -n "$((l+1))p" "$f"); rf=$(sed -n "$((l+2))p" "$f")
    if echo "$rf" | grep -qx '  - `rf:`'; then :
    elif echo "$rf" | grep -qx '  - `rf: =ev`' && echo "$ev" | grep -q '`ev: mihkel`'; then :
    else continue; fi
    sed -n "${l}p" "$f" | sed "s|^|$f:$l  |"
  done | head -"$STILL_TRUE_MAX_PER_WEEK"
echo "## stubs"
for f in $live; do
  n=$(grep -c '^- ' "$f")
  created=$(git log --diff-filter=A --format=%as -- "$f" | tail -1)
  [ -n "$created" ] || continue
  if [ "$n" -lt "$STUB_FACTS_MIN" ] && [ "$created" \< "$cutoff" ]; then
    echo "$f: $n facts, created $created -- consolidation candidate"
  fi
done
exit 0
