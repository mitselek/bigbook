#!/usr/bin/env python3
"""m_001: Strip form feed characters."""
from pathlib import Path
from apply_re import parse_re_file, apply_fixes

here = Path(__file__).parent
text = (here.parent / "en-4th-edition.raw.txt").read_text()
fixes = parse_re_file(here / "m_001_fixes.re")
text, applied = apply_fixes(text, fixes)
(here / "m_001.txt").write_text(text)
print(f"m_001: {applied}/{len(fixes)} patterns applied")
