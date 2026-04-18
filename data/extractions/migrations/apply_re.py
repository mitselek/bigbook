#!/usr/bin/env python3
"""Generic regex replacement applier.

Usage: python3 apply_re.py INPUT_FILE FIXES_FILE OUTPUT_FILE

FIXES_FILE format (.re): one sed-style pattern per line:
  s/FIND_REGEX/REPLACEMENT/     first match only
  s/FIND_REGEX/REPLACEMENT/g    all matches

Lines starting with # are comments. Empty lines are skipped.
Escape sequences: \\n = one or more newlines, \\f = form feed, \\t = tab.
"""
import re
import sys
from pathlib import Path


def parse_re_file(path):
    """Parse a .re file into (pattern, replacement, global) tuples."""
    fixes = []
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        # Match s/pattern/replacement/ or s/pattern/replacement/g
        m = re.match(r'^s/(.+)/(.*)/([g]?)$', line)
        if m:
            pattern = m.group(1).replace('\\n', '\n+').replace('\\f', '\f').replace('\\t', '\t')
            replacement = m.group(2).replace('\\n', '\n').replace('\\f', '\f').replace('\\t', '\t')
            global_flag = m.group(3) == 'g'
            fixes.append((pattern, replacement, global_flag))
        else:
            print(f"WARNING: skipping malformed line: {line}", file=sys.stderr)
    return fixes


def apply_fixes(text, fixes):
    """Apply regex fixes to text. Returns (new_text, applied_count)."""
    applied = 0
    for pattern, replacement, global_flag in fixes:
        count = 0 if global_flag else 1
        new_text = re.sub(pattern, replacement, text, count=count, flags=re.MULTILINE)
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
