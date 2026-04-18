#!/usr/bin/env python3
"""Generic regex replacement applier.

Usage: python3 apply_re.py INPUT_FILE FIXES_FILE OUTPUT_FILE

FIXES_FILE format (.re): one sed-style pattern per line:
  s/FIND_REGEX/REPLACEMENT/

Lines starting with # are comments. Empty lines are skipped.
\\n in patterns matches one or more newlines (to span page breaks).
Each pattern is applied once (first match only).
"""
import re
import sys
from pathlib import Path


def parse_re_file(path):
    """Parse a .re file into (pattern, replacement) pairs."""
    fixes = []
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        m = re.match(r'^s/(.+)/(.*)/$', line)
        if m:
            # \n matches one or more newlines (to span page breaks)
            pattern = m.group(1).replace('\\n', '\n+')
            replacement = m.group(2)
            fixes.append((pattern, replacement))
        else:
            print(f"WARNING: skipping malformed line: {line}", file=sys.stderr)
    return fixes


def apply_fixes(text, fixes):
    """Apply regex fixes to text. Returns (new_text, applied_count)."""
    applied = 0
    for pattern, replacement in fixes:
        new_text = re.sub(pattern, replacement, text, count=1)
        if new_text != text:
            applied += 1
            text = new_text
    return text, applied


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print(f"Usage: {sys.argv[0]} INPUT_FILE FIXES_FILE OUTPUT_FILE")
        sys.exit(1)

    src, fixes_path, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    text = Path(src).read_text()
    fixes = parse_re_file(fixes_path)
    text, applied = apply_fixes(text, fixes)
    Path(dst).write_text(text)
    print(f"apply_re: {applied}/{len(fixes)} patterns applied")
