#!/usr/bin/env python3
"""m_007: Rejoin hyphenated words split across lines.

Uses m_007_fixes.re. If it doesn't exist, generates it with default joins.
"""
import re
from pathlib import Path
from apply_re import parse_re_file, apply_fixes

here = Path(__file__).parent
src = here / "m_006.txt"
dst = here / "m_007.txt"
fixes_file = here / "m_007_fixes.re"

text = src.read_text()

if not fixes_file.exists():
    lines = text.splitlines()
    patterns = []
    for i, line in enumerate(lines):
        s = line.rstrip()
        if not s.endswith('-') or not s.split():
            continue
        word = s.split()[-1]
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        if j < len(lines) and lines[j].strip():
            cont = lines[j].strip().split()[0]
            result = word[:-1] + cont
            word_esc = re.escape(word)
            cont_esc = re.escape(cont)
            patterns.append(f"s/{word_esc}\\n{cont_esc}/{result}/")
    fixes_file.write_text('\n'.join(patterns) + '\n')
    print(f"Generated {fixes_file.name} with {len(patterns)} patterns")
    print("Review and edit, then run again to apply.")
else:
    fixes = parse_re_file(fixes_file)
    text, applied = apply_fixes(text, fixes)
    dst.write_text(text)
    print(f"m_007: {applied}/{len(fixes)} patterns applied")
