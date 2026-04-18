#!/usr/bin/env python3
"""m_005: Rejoin hyphenated words split across lines.

Step 1: Scan for lines ending with hyphen, generate m_005_candidates.txt
Step 2: Read m_005_fixes.txt (explicit fixes), apply to produce m_005.txt

Fixes format: LINE_NUM<tab>join|keep
  join = remove hyphen and merge with next line's first word
  keep = leave as-is (real hyphenated word)
"""
from pathlib import Path

here = Path(__file__).parent
src = here / "m_004.txt"
dst = here / "m_005.txt"
candidates_file = here / "m_005_candidates.txt"
fixes_file = here / "m_005_fixes.txt"

lines = src.read_text().splitlines()

if not fixes_file.exists():
    # Step 1: generate candidates
    with open(candidates_file, 'w') as f:
        f.write("# m_005 hyphenation candidates\n")
        f.write("# LINE_NUM<tab>WORD-<tab>CONTINUATION<tab>JOINED_RESULT\n")
        f.write("# Copy to m_005_fixes.txt with: LINE_NUM<tab>join or LINE_NUM<tab>keep\n")
        f.write("#\n")
        for i, line in enumerate(lines):
            s = line.rstrip()
            if s.endswith('-') and i + 1 < len(lines):
                word_before = s.split()[-1] if s.split() else '-'
                # Find continuation: skip blank lines
                j = i + 1
                while j < len(lines) and not lines[j].strip():
                    j += 1
                if j < len(lines):
                    word_after = lines[j].strip().split()[0] if lines[j].strip() else '???'
                    joined = word_before[:-1] + word_after
                    f.write(f"{i}\t{word_before}\t{word_after}\t{joined}\n")
                else:
                    f.write(f"{i}\t{word_before}\t???\t???\n")
    print(f"Candidates written to {candidates_file.name}")
    print(f"Create {fixes_file.name} with: LINE_NUM\\tjoin or LINE_NUM\\tkeep")
else:
    # Step 2: apply fixes
    fixes = {}
    for fix_line in fixes_file.read_text().splitlines():
        fix_line = fix_line.strip()
        if not fix_line or fix_line.startswith('#'):
            continue
        parts = fix_line.split('\t')
        if len(parts) >= 2:
            fixes[int(parts[0])] = parts[1]

    # For each join, find which line provides the continuation word
    # and record what word to steal from it
    steal_word_from = {}  # line_index -> True (steal first word)
    for i in sorted(fixes):
        if fixes[i] != 'join':
            continue
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        if j < len(lines):
            steal_word_from[j] = True

    out = []
    applied = 0
    i = 0
    while i < len(lines):
        s = lines[i].rstrip()

        if i in fixes and fixes[i] == 'join':
            # Remove trailing hyphen
            current = s[:-1]
            # Find next non-blank line
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines):
                next_words = lines[j].strip().split(None, 1)
                current += next_words[0]
                applied += 1
            out.append(current)
            i += 1
        elif i in steal_word_from:
            # First word was stolen by previous join
            parts = s.split(None, 1)
            if len(parts) > 1:
                remainder = parts[1]
                # This remainder might itself end with - and need joining
                if i in fixes and fixes[i] == 'join':
                    # handled above (shouldn't reach here)
                    out.append(remainder)
                else:
                    out.append(remainder)
            # else: line was just one word, consumed entirely — skip
            i += 1
        else:
            out.append(s)
            i += 1

    dst.write_text("\n".join(out) + "\n")
    print(f"m_005: {applied}/{sum(1 for v in fixes.values() if v == 'join')} joins applied")
