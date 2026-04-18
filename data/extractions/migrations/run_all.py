#!/usr/bin/env python3
"""Run all migrations in order."""
import subprocess
import sys
from pathlib import Path

here = Path(__file__).parent

MIGRATIONS = [
    "m_001.py",  # strip form feeds
    "m_002.py",  # strip leading whitespace
    "m_003.py",  # remove print artifacts (Alco_*.qxd)
    "m_004.py",  # remove headers/footers/page numbers
    "m_005.py",  # fix drop-cap words
    "m_006.py",  # tag paragraph types
    "m_007.py",  # rejoin hyphenated line breaks
    "m_008.py",  # join wrapped lines into paragraphs
    "m_009.py",  # normalize blank lines
]

for script in MIGRATIONS:
    path = here / script
    if not path.exists():
        print(f"SKIP {script} (not found)")
        continue
    result = subprocess.run(
        [sys.executable, str(path)],
        cwd=str(here),
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"FAIL {script}:")
        print(result.stderr)
        sys.exit(1)
    print(result.stdout.rstrip())
