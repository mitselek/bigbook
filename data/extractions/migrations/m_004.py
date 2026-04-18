#!/usr/bin/env python3
"""m_004: Remove running headers/footers and standalone page numbers."""
from pathlib import Path
from apply_re import parse_re_file, apply_fixes

here = Path(__file__).parent
text = (here / "m_003.txt").read_text()
fixes = parse_re_file(here / "m_004_fixes.re")
text, applied = apply_fixes(text, fixes)
(here / "m_004.txt").write_text(text)
print(f"m_004: {applied}/{len(fixes)} patterns applied")
