#!/usr/bin/env python3
"""m_003: Fix spaced-out drop-cap words.

Handles three categories:
  - I/A + extra spaces + word: "I" and "A" are real words, keep space
    ("I    was" -> "I was", "A         little" -> "A little")
  - Other letter + extra spaces + lowercase: join into one word
    ("R         arely" -> "Rarely")
  - Letter + 1 space + ALLCAPS word: join ("S INCE" -> "SINCE")
  - Skip titles like "A VISION FOR YOU", "A DRUNK, LIKE YOU"
"""
import re
from pathlib import Path

here = Path(__file__).parent
src = here / "m_002.txt"
dst = here / "m_003.txt"
candidates_file = here / "m_003_candidates.txt"

lines = src.read_text().splitlines()

# Titles that start with "A " and should NOT be touched
TITLE_SKIP = re.compile(r'^\s*A [A-Z]{2,}\b')

# Patterns
DROP_CAP_MULTI_SPACE = re.compile(r'^(\s*)([A-Z])\s{2,}([a-zA-Z])')
DROP_CAP_SINGLE_SPACE = re.compile(r'^(\s*)([B-HJ-Z]) ([A-Z]{2,}\b)')

candidates = []
fixed = 0
out = []

for i, line in enumerate(lines):
    new_line = line

    # Skip lines that look like titles ("A VISION FOR YOU", etc.)
    if TITLE_SKIP.match(line):
        out.append(line)
        continue

    m = DROP_CAP_MULTI_SPACE.match(line)
    if m:
        lead, cap, rest_char = m.group(1), m.group(2), m.group(3)
        if cap in ('I', 'A') and rest_char.isupper():
            # I/A followed by uppercase = standalone word + next word
            # ("I     W..." never happens, but just in case)
            new_line = DROP_CAP_MULTI_SPACE.sub(r'\1\2 \3', line)
        elif cap in ('I', 'A') and rest_char.islower():
            # Check: is the rest a new word or continuation of I/A?
            # Look at what follows: if it forms a known word with I/A, join
            # e.g. "I   n" -> "In", "A    mong" -> "Among"
            # but "I    was" -> "I was"
            rest_of_line = line[m.end(2):].lstrip()
            first_word = re.match(r'([a-z]+)', rest_of_line)
            if first_word:
                candidate_word = cap + first_word.group(1)
                # If joining makes a real word starting with capital
                # (In, If, It, Is, Among, After, etc.) -> join
                # If it would make "Iwas", "Istarted" etc. -> space
                # Heuristic: if joined word is <= 6 chars, likely a real word
                # Better heuristic: the continuation starts a new word
                # (followed by space), so check the original pattern
                rest_after_word = rest_of_line[len(first_word.group(1)):]
                if rest_after_word and rest_after_word[0] in (' ', "'", "\u2019"):
                    # "n the" -> "In the" (join), "was born" -> "I was" (space)
                    # Join if the fragment alone isn't a word (n, f, mong)
                    fragment = first_word.group(1)
                    # Common short words that follow I/A as standalone
                    real_words = {
                        'a','am','an','as','at','be','by','do','go',
                        'ha','he','hi','if','in','is','it','me','my',
                        'no','of','oh','ok','on','or','so','to','up',
                        'us','we','was','got','had','has','can','did',
                        'get','let','may','put','ran','sat','saw','say',
                        'set','the','too','try','use','yet',
                        'also','came','come','been','felt','find',
                        'gave','grew','just','kept','knew','know',
                        'last','left','like','live','long','look',
                        'lost','made','must','need','once','only',
                        'paid','part','said','seem','some','soon',
                        'spent','start','still','stop','sure','take',
                        'tell','than','that','them','then','they',
                        'this','till','told','took','true','turn',
                        'used','very','want','went','were','will',
                        'with','work','would','could','should',
                        'thought','started','suppose','believe',
                        'little','always','really',
                        'didn','don',
                    }
                    if fragment in real_words:
                        new_line = DROP_CAP_MULTI_SPACE.sub(r'\1\2 \3', line)
                    else:
                        # Not a real word -> part of the drop cap
                        new_line = DROP_CAP_MULTI_SPACE.sub(r'\1\2\3', line)
                else:
                    new_line = DROP_CAP_MULTI_SPACE.sub(r'\1\2\3', line)
            else:
                new_line = DROP_CAP_MULTI_SPACE.sub(r'\1\2 \3', line)
        else:
            # Other letters join directly to the word
            new_line = DROP_CAP_MULTI_SPACE.sub(r'\1\2\3', line)
    else:
        m2 = DROP_CAP_SINGLE_SPACE.match(line)
        if m2:
            new_line = DROP_CAP_SINGLE_SPACE.sub(r'\1\2\3', line)

    if new_line != line:
        candidates.append((i, line.strip(), new_line.strip()))
        fixed += 1
    out.append(new_line)

# Write candidates log for review
with open(candidates_file, 'w') as f:
    f.write("# m_003 drop-cap fixes applied\n")
    f.write("# LINE_NUM | ORIGINAL | FIXED\n")
    for lineno, original, fixed_line in candidates:
        f.write(f"{lineno}\t| {original}\t| {fixed_line}\n")

dst.write_text("\n".join(out) + "\n")
print(f"m_003: {fixed} drop-cap words fixed")
