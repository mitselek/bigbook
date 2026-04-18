#!/usr/bin/env python3
"""m_003: Fix spaced-out drop-cap words.

Step 1: Scan m_002.txt for drop-cap candidates, write m_003_candidates.txt
Step 2: Read m_003_fixes.txt (explicit per-line replacements), apply to produce m_003.txt

Run without m_003_fixes.txt to generate candidates.
Run with m_003_fixes.txt to apply fixes.
"""
import re
from pathlib import Path

here = Path(__file__).parent
src = here / "m_002.txt"
dst = here / "m_003.txt"
candidates_file = here / "m_003_candidates.txt"
fixes_file = here / "m_003_fixes.txt"

lines = src.read_text().splitlines()

# Pattern: single capital letter + 2 or more extra spaces + letter
DROP_CAP_RE = re.compile(r'^(\s*)([A-Z])\s{2,}([a-zA-Z])')
# Pattern: single capital letter + 1 space + ALLCAPS word
DROP_CAP_RE2 = re.compile(r'^(\s*)([A-Z]) ([A-Z]{2,}\b)')

if not fixes_file.exists():
    # Step 1: generate candidates
    with open(candidates_file, 'w') as f:
        f.write("# m_003 drop-cap candidates\n")
        f.write("# Review and copy valid lines to m_003_fixes.txt\n")
        f.write("# Format: LINE_NUM<tab>OLD_PATTERN<tab>NEW_PATTERN\n")
        f.write("#\n")
        for i, line in enumerate(lines):
            stripped = line.strip()
            m = DROP_CAP_RE.match(line)
            m2 = DROP_CAP_RE2.match(line)
            if m or m2:
                f.write(f"{i}\t{stripped}\n")
    print(f"Candidates written to {candidates_file.name}")
    print(f"Create {fixes_file.name} with lines: LINE_NUM\\tOLD\\tNEW")
else:
    # Step 2: apply fixes
    fixes = {}
    for fix_line in fixes_file.read_text().splitlines():
        fix_line = fix_line.strip()
        if not fix_line or fix_line.startswith('#'):
            continue
        parts = fix_line.split('\t')
        if len(parts) == 3:
            lineno, old, new = int(parts[0]), parts[1], parts[2]
            fixes[lineno] = (old, new)

    applied = 0
    out = []
    for i, line in enumerate(lines):
        if i in fixes:
            old, new = fixes[i]
            if old in line:
                line = line.replace(old, new, 1)
                applied += 1
            else:
                print(f"WARNING line {i}: pattern not found: {old}")
        out.append(line)

    dst.write_text("\n".join(out) + "\n")
    print(f"m_003: {applied}/{len(fixes)} fixes applied")
