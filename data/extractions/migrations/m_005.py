#!/usr/bin/env python3
"""m_005: Rejoin hyphenated words split across lines.

All lines ending with a trailing hyphen get joined with the first word
of the next non-blank line, UNLESS the resulting compound word matches
a pattern in m_005_keep.txt (real hyphenated compounds to preserve).

m_005_keep.txt format: one word per line, lowercase, e.g.:
  self-pity
  so-called
  well-to-do
"""
import re
from pathlib import Path

here = Path(__file__).parent
src = here / "m_004.txt"
dst = here / "m_005.txt"
keep_file = here / "m_005_keep.txt"
log_file = here / "m_005_log.txt"

lines = src.read_text().splitlines()

# Load keep patterns
keep_words = set()
if keep_file.exists():
    for l in keep_file.read_text().splitlines():
        l = l.strip()
        if l and not l.startswith('#'):
            keep_words.add(l.lower())

def is_keep(word_with_hyphen, continuation):
    """Check if word-continuation is a real compound to keep."""
    # word_with_hyphen ends with '-', continuation is next word
    stem = word_with_hyphen[:-1]  # remove trailing hyphen
    cont = re.sub(r'[.,;:!?"''\'"]+$', '', continuation)
    # Build the full compound
    compound = (stem + '-' + cont).lower()
    # Check against keep list — also check last hyphen segment
    # for multi-segment words like "self-centered-ness"
    if compound in keep_words:
        return True
    # Check sub-compounds: e.g. for "self-centered-ness",
    # check "centered-ness" too
    parts = compound.split('-')
    for i in range(len(parts) - 1):
        sub = '-'.join(parts[i:])
        if sub in keep_words:
            return True
    return False

# Process
out = []
log = []
joined = 0
kept = 0
steal_first_word_from = set()

# First pass: identify which lines donate their first word
for i, line in enumerate(lines):
    s = line.rstrip()
    if not s.endswith('-'):
        continue
    word = s.split()[-1] if s.split() else ''
    # Find next non-blank line
    j = i + 1
    while j < len(lines) and not lines[j].strip():
        j += 1
    if j >= len(lines):
        continue
    cont = lines[j].strip().split()[0] if lines[j].strip() else ''
    if not cont:
        continue
    if is_keep(word, cont):
        kept += 1
        log.append(f"KEEP\t{word}\t{cont}\t{word[:-1]}-{cont}")
    else:
        steal_first_word_from.add(j)

# Second pass: build output
i = 0
while i < len(lines):
    s = lines[i].rstrip()

    # If first word was stolen, work with remainder
    if i in steal_first_word_from:
        parts = s.split(None, 1)
        if len(parts) > 1:
            s = parts[1]
        else:
            i += 1
            continue

    # If this line ends with hyphen and is a join candidate
    if s.endswith('-') and s.split():
        word = s.split()[-1]
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        if j < len(lines) and lines[j].strip():
            cont = lines[j].strip().split()[0]
            if not is_keep(word, cont):
                # Join: remove hyphen, append continuation word
                s = s[:-1] + cont
                joined += 1
                log.append(f"JOIN\t{word}\t{cont}\t{s.split()[-1]}")

    out.append(s)
    i += 1

with open(log_file, 'w') as f:
    f.write(f"# m_005: {joined} joined, {kept} kept\n")
    for entry in log:
        f.write(entry + "\n")

dst.write_text("\n".join(out) + "\n")
print(f"m_005: {joined} joined, {kept} kept")
