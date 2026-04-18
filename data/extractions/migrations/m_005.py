#!/usr/bin/env python3
"""m_005: Rejoin hyphenated words split across lines.

Uses m_005_fixes.txt with explicit replacements:
  WORD_WITH_HYPHEN<tab>CONTINUATION<tab>RESULT

Example:
  Platts-	burg	Plattsburg      (join)
  self-	pity	self-pity       (keep hyphen)

If m_005_fixes.txt doesn't exist, generates it from m_004.txt
with default suggestions (all joins). Edit to mark keeps.
"""
import re
from pathlib import Path

here = Path(__file__).parent
src = here / "m_004.txt"
dst = here / "m_005.txt"
fixes_file = here / "m_005_fixes.txt"

lines = src.read_text().splitlines()


def find_candidates():
    """Find all line-ending hyphens and their continuations."""
    candidates = []
    for i, line in enumerate(lines):
        s = line.rstrip()
        if not s.endswith('-') or not s.split():
            continue
        word = s.split()[-1]
        # Find next non-blank line
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        if j < len(lines) and lines[j].strip():
            cont = lines[j].strip().split()[0]
            # Default: join (remove hyphen)
            result = word[:-1] + cont
            candidates.append((word, cont, result))
    return candidates


if not fixes_file.exists():
    candidates = find_candidates()
    with open(fixes_file, 'w') as f:
        f.write("# m_005 fixes: WORD_HYPHEN<tab>CONTINUATION<tab>RESULT\n")
        f.write("# Edit RESULT to keep hyphen, e.g.: self-<tab>pity<tab>self-pity\n")
        for word, cont, result in candidates:
            f.write(f"{word}\t{cont}\t{result}\n")
    print(f"Generated {fixes_file.name} with {len(candidates)} entries")
    print("Review and edit, then run again to apply.")
else:
    # Load fixes into lookup: (word, cont) -> result
    fixes = []
    for fl in fixes_file.read_text().splitlines():
        fl = fl.strip()
        if not fl or fl.startswith('#'):
            continue
        parts = fl.split('\t')
        if len(parts) == 3:
            fixes.append((parts[0], parts[1], parts[2]))

    # Build a set for quick lookup
    fix_map = {}
    for word, cont, result in fixes:
        fix_map.setdefault(word, []).append((cont, result))

    # Apply
    out = []
    applied = 0
    skip_first_word = set()  # line indices where first word was consumed

    # First pass: identify lines that donate their first word
    for i, line in enumerate(lines):
        s = line.rstrip()
        if not s.endswith('-') or not s.split():
            continue
        word = s.split()[-1]
        if word not in fix_map:
            continue
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        if j >= len(lines) or not lines[j].strip():
            continue
        cont = lines[j].strip().split()[0]
        for fc, fr in fix_map[word]:
            if fc == cont:
                # Check if result keeps the hyphen (word stays at line end)
                if '-' in fr and fr == word[:-1] + '-' + cont:
                    # Keep: don't steal the word
                    pass
                else:
                    skip_first_word.add(j)
                break

    # Second pass: build output
    for i, line in enumerate(lines):
        s = line.rstrip()

        if i in skip_first_word:
            parts = s.split(None, 1)
            if len(parts) > 1:
                s = parts[1]
            else:
                continue  # entire line was just the stolen word

        if s.endswith('-') and s.split():
            word = s.split()[-1]
            if word in fix_map:
                j = i + 1
                while j < len(lines) and not lines[j].strip():
                    j += 1
                if j < len(lines) and lines[j].strip():
                    cont = lines[j].strip().split()[0]
                    for fc, fr in fix_map[word]:
                        if fc == cont:
                            if '-' in fr and fr == word[:-1] + '-' + cont:
                                # Keep hyphen — leave line as-is
                                pass
                            else:
                                # Replace last word with result
                                words = s.rsplit(None, 1)
                                s = (words[0] + ' ' + fr) if len(words) > 1 else fr
                                applied += 1
                            break

        out.append(s)

    dst.write_text("\n".join(out) + "\n")
    print(f"m_005: {applied} replacements applied")
