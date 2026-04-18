#!/usr/bin/env python3
"""m_006: Tag paragraph types.

Uses m_006_fixes.re to classify lines by inserting [[type]] markers.
Patterns in the .re file match lines and prepend them with a tag.

If m_006_fixes.re doesn't exist, generates candidate patterns.
"""
import re
from pathlib import Path
from apply_re import parse_re_file, apply_fixes

here = Path(__file__).parent
src = here / "m_007.txt"
dst = here / "m_006.txt"
fixes_file = here / "m_006_fixes.re"

text = src.read_text()

if not fixes_file.exists():
    # Scan for potential headings and other special lines
    lines = text.splitlines()
    headings = []
    footnotes = []
    list_items = []

    for i, line in enumerate(lines):
        s = line.strip()
        if not s:
            continue
        if s.startswith('* '):
            footnotes.append((i, s[:60]))
        elif re.match(r'^\d+\.\s', s):
            list_items.append((i, s[:60]))
        elif re.match(r'^Chapter\s+\d+', s):
            headings.append((i, s))
        elif (len(s) < 80 and
              re.match(r'^[A-Z][A-Z0-9 .,\'\u2019()\-—*]+$', s)):
            headings.append((i, s))
        elif s == 'Preface':
            headings.append((i, s))

    with open(fixes_file, 'w') as f:
        f.write("# m_006: tag paragraph types\n")
        f.write("# Each pattern inserts a [[type]] marker before matching line\n")
        f.write("#\n")
        f.write("# Format: s/^PATTERN$/[[type]]\\nMATCH/\n")
        f.write("# where type is: heading, footnote, list-item, verse, blockquote, paragraph\n\n")
        f.write("# === HEADINGS ===\n")
        for idx, h in headings:
            f.write(f"# line {idx}: {h}\n")
        f.write("\n# === FOOTNOTES ===\n")
        for idx, fn in footnotes:
            f.write(f"# line {idx}: {fn}\n")
        f.write("\n# === LIST ITEMS ===\n")
        for idx, li in list_items:
            f.write(f"# line {idx}: {li}\n")

    print(f"Generated {fixes_file.name}")
    print(f"  {len(headings)} heading candidates")
    print(f"  {len(footnotes)} footnote candidates")
    print(f"  {len(list_items)} list-item candidates")
    print("Edit the file to add s/ patterns, then run again.")
else:
    fixes = parse_re_file(fixes_file)
    text, applied = apply_fixes(text, fixes)

    # Tag remaining untagged blocks as [[paragraph]]
    lines = text.splitlines()
    out = []
    prev_blank = True
    for line in lines:
        if not line.strip():
            out.append('')
            prev_blank = True
        elif re.match(r'^\[\[.+\]\]$', line):
            # Ensure blank line before tag
            if out and not prev_blank:
                out.append('')
            out.append(line)
            prev_blank = False
        else:
            if prev_blank:
                out.append('[[paragraph]]')
            out.append(line)
            prev_blank = False

    text = "\n".join(out) + "\n"
    dst.write_text(text)

    from collections import Counter
    counts = Counter(re.findall(r'\[\[(\w[\w-]*)\]\]', text))
    parts = ', '.join(f"{k}: {v}" for k, v in sorted(counts.items()))
    print(f"m_006: {applied} patterns applied, tagged ({parts})")
