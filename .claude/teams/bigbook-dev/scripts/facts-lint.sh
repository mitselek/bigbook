#!/usr/bin/env bash
# Structural lint for memory/facts/. Spec: designs/facts-memory-redesign.md
set -u
SDIR="$(cd "$(dirname "$0")" && pwd)"
cd "$(git -C "$SDIR" rev-parse --show-toplevel)"
. "$SDIR/facts.env"
dir="${1:-$FACTS_DIR}"
rc=0
viol() { echo "$1: $2"; rc=1; }
for f in "$dir"/*.md; do
  [ -e "$f" ] || continue
  base=$(basename "$f" .md)
  words=$(echo "$base" | tr '-' ' ' | wc -w)
  [ "$words" -le "$SLUG_WORDS_MAX" ] || viol "$f" "slug has $words words (max $SLUG_WORDS_MAX)"
  sed -n '1p' "$f" | grep -qx -- '---' || viol "$f" "frontmatter line 1 not ---"
  sed -n '2p' "$f" | grep -qxE 'type: (person|org|service|rule|commitment)' || viol "$f" "bad type line"
  sed -n '3p' "$f" | grep -qxE 'status: (live|dormant)' || viol "$f" "bad status line"
  sed -n '4p' "$f" | grep -qx -- '---' || viol "$f" "frontmatter line 4 not ---"
  sed -n '5p' "$f" | grep -qx '' || viol "$f" "line 5 not blank"
  total=$(wc -l < "$f")
  nfacts=0
  ln=6
  while [ "$ln" -le "$total" ]; do
    truth=$(sed -n "${ln}p" "$f")
    evln=$((ln+1)); ev=$(sed -n "${evln}p" "$f")
    case "$truth" in
      "- "*) : ;;
      *) viol "$f" "geometry: line $ln is not a truth line"; break ;;
    esac
    echo "$truth" | grep -qE '`v:[0-9]{4}-[0-9]{2}-[0-9]{2}`' || viol "$f" "line $ln missing v: token"
    prose=$(echo "$truth" | sed 's/`[^`]*`//g; s/^- //')
    pw=$(echo "$prose" | wc -w)
    [ "$pw" -le "$FACT_WORDS_MAX" ] || viol "$f" "line $ln: $pw words (max $FACT_WORDS_MAX)"
    echo "$prose" | grep -qE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+|1a[0-9a-f]{14}' && viol "$f" "line $ln: identifier in prose (belongs in ev:)"
    echo "$ev" | grep -qE '^  - `ev: .+`$' || viol "$f" "geometry: line $evln is not an ev: line"
    rfln=$((ln+2)); rf=$(sed -n "${rfln}p" "$f")
    echo "$rf" | grep -qE '^  - `rf:( [^ ].*)?`$' || viol "$f" "geometry: line $rfln is not an rf: line"
    nfacts=$((nfacts+1))
    ln=$((ln+3))
  done
  [ "$nfacts" -le "$FACTS_PER_FILE_MAX" ] || viol "$f" "$nfacts facts (max $FACTS_PER_FILE_MAX)"
  [ "$nfacts" -ge 1 ] || viol "$f" "no facts"
done
exit $rc
