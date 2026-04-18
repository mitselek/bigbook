#!/usr/bin/env python3
"""Convert m_009.txt (tagged paragraphs) to en-4th-edition JSON format.

Uses the TOC structure to assign blocks to sections.
"""
import json
import re
from pathlib import Path

here = Path(__file__).parent
src = here / "m_009.txt"
ref = here.parent / "en-4th-edition.json"

# Load reference for structure comparison
ref_data = json.load(open(ref))

# Section definitions from TOC (id, kind, title)
SECTIONS = [
    ("copyright-info", "front-matter", "Copyright Info"),
    ("preface", "preface", "Preface"),
    ("foreword-1st-edition", "foreword", "Foreword to First"),
    ("foreword-2nd-edition", "foreword", "Foreword to Second"),
    ("foreword-3rd-edition", "foreword", "Foreword to Third"),
    ("foreword-4th-edition", "foreword", "Foreword to Fourth"),
    ("doctors-opinion", "doctors-opinion", "The Doctors Opinion"),
    ("ch01-bills-story", "chapter", "Bill's Story"),
    ("ch02-there-is-a-solution", "chapter", "There is a Solution"),
    ("ch03-more-about-alcoholism", "chapter", "More About Alcoholism"),
    ("ch04-we-agnostics", "chapter", "We Agnostics"),
    ("ch05-how-it-works", "chapter", "How It Works"),
    ("ch06-into-action", "chapter", "Into Action"),
    ("ch07-working-with-others", "chapter", "Working with Others"),
    ("ch08-to-wives", "chapter", "To Wives"),
    ("ch09-the-family-afterward", "chapter", "The Family Afterward"),
    ("ch10-to-employers", "chapter", "To Employers"),
    ("ch11-a-vision-for-you", "chapter", "A Vision For You"),
    ("story-dr-bobs-nightmare", "story", "Dr. Bob's Nightmare"),
    ("story-aa-number-three", "story", "A.A. Number Three"),
    ("story-gratitude-in-action", "story", "Gratitude in Action"),
    ("story-women-suffer-too", "story", "Women Suffer Too"),
    ("story-our-southern-friend", "story", "Our Southern Friend"),
    ("story-the-vicious-cycle", "story", "The Vicious Cycle"),
    ("story-jims-story", "story", "Jim's Story"),
    ("story-the-man-who-mastered-fear", "story", "The Man Who Mastered Fear"),
    ("story-he-sold-himself-short", "story", "He Sold Himself Short"),
    ("story-the-keys-of-the-kingdom", "story", "The Keys of the Kingdom"),
    ("story-the-missing-link", "story", "The Missing Link"),
    ("story-fear-of-fear", "story", "Fear of Fear"),
    ("story-the-housewife-who-drank-at-home", "story", "The Housewife Who Drank at Home"),
    ("story-physician-heal-thyself", "story", "Physician, Heal Thyself!"),
    ("story-my-chance-to-live", "story", "My Chance to Live"),
    ("story-student-of-life", "story", "Student of Life"),
    ("story-crossing-the-river-of-denial", "story", "Crossing the River of Denial"),
    ("story-because-im-an-alcoholic", "story", "Because I'm an Alcoholic"),
    ("story-it-might-have-been-worse", "story", "It Might Have Been Worse"),
    ("story-tightrope", "story", "Tightrope"),
    ("story-flooded-with-feeling", "story", "Flooded with Feeling"),
    ("story-winner-takes-all", "story", "Winner Takes All"),
    ("story-me-an-alcoholic", "story", "Me An Alcoholic?"),
    ("story-the-perpetual-quest", "story", "The Perpetual Quest"),
    ("story-a-drunk-like-you", "story", "A Drunk, Like You"),
    ("story-acceptance-was-the-answer", "story", "Acceptance was the Answer"),
    ("story-window-of-opportunity", "story", "Window of Opportunity"),
    ("story-my-bottle-my-resentments-and-me", "story", "My Bottle, My Resentments, and Me"),
    ("story-he-lived-only-to-drink", "story", "He Lived Only to Drink"),
    ("story-safe-haven", "story", "Safe Haven"),
    ("story-listening-to-the-wind", "story", "Listening to the Wind"),
    ("story-twice-gifted", "story", "Twice Gifted"),
    ("story-building-a-new-life", "story", "Building a New Life"),
    ("story-on-the-move", "story", "On the Move"),
    ("story-a-vision-of-recovery", "story", "A Vision of Recovery"),
    ("story-gutter-bravado", "story", "Gutter Bravado"),
    ("story-empty-on-the-inside", "story", "Empty on the Inside"),
    ("story-grounded", "story", "Grounded"),
    ("story-another-chance", "story", "Another Chance"),
    ("story-a-late-start", "story", "A Late Start"),
    ("story-freedom-from-bondage", "story", "Freedom From Bondage"),
    ("story-aa-taught-him-to-handle-sobriety", "story", "A.A. Taught Him to Handle Sobriety"),
    ("appendix-i-the-aa-tradition", "appendix", "I — The A.A. Tradition"),
    ("appendix-ii-spiritual-experience", "appendix", "II — Spiritual Experience"),
    ("appendix-iii-the-medical-view-on-aa", "appendix", "III — The Medical View on A.A."),
    ("appendix-iv-the-lasker-award", "appendix", "IV — The Lasker Award"),
    ("appendix-v-the-religious-view-on-aa", "appendix", "V — The Religious View on A.A."),
    ("appendix-vi-how-to-get-in-touch-with-aa", "appendix", "VI — How to get in Touch with A.A."),
    ("appendix-vii-the-twelve-concepts", "appendix", "VII — The Twelve Concepts"),
    ("appendix-aa-pamphlets", "appendix", "A.A. Pamphlets"),
]

# Heading patterns to match section starts (order matters — matched top-down)
SECTION_HEADINGS = {
    "copyright-info": None,  # First block, no heading
    "preface": r"Preface",
    "foreword-1st-edition": r"FOREWORD TO FIRST EDITION",
    "foreword-2nd-edition": r".*FOREWORD TO SECOND EDITION",
    "foreword-3rd-edition": r"FOREWORD TO THIRD EDITION",
    "foreword-4th-edition": r"FOREWORD TO FOURTH EDITION",
    "doctors-opinion": r"THE DOCTORS OPINION",
    "ch01-bills-story": r"Chapter 1",
    "ch02-there-is-a-solution": r"Chapter 2",
    "ch03-more-about-alcoholism": r"Chapter 3",
    "ch04-we-agnostics": r"Chapter 4",
    "ch05-how-it-works": r"Chapter 5",
    "ch06-into-action": r"Chapter 6",
    "ch07-working-with-others": r"Chapter 7",
    "ch08-to-wives": r"Chapter 8",
    "ch09-the-family-afterward": r"Chapter 9",
    "ch10-to-employers": r"Chapter 10",
    "ch11-a-vision-for-you": r"Chapter 11",
    "story-dr-bobs-nightmare": r".*DOCTOR BOB",
    "story-aa-number-three": r".*ALCOHOLIC ANONYMOUS NUMBER THREE",
    "story-gratitude-in-action": r".*GRATITUDE IN ACTION",
    "story-women-suffer-too": r".*WOMEN SUFFER TOO",
    "story-our-southern-friend": r".*OUR SOUTHERN FRIEND",
    "story-the-vicious-cycle": r".*VICIOUS CYCLE",
    "story-jims-story": r".*JIM.*S STORY",
    "story-the-man-who-mastered-fear": r".*MAN WHO MASTERED FEAR",
    "story-he-sold-himself-short": r".*HE SOLD HIMSELF SHORT",
    "story-the-keys-of-the-kingdom": r".*KEYS OF THE KINGDOM",
    "story-the-missing-link": r".*MISSING LINK",
    "story-fear-of-fear": r".*FEAR OF FEAR",
    "story-the-housewife-who-drank-at-home": r".*HOUSEWIFE WHO DRANK",
    "story-physician-heal-thyself": r".*PHYSICIAN.*HEAL",
    "story-my-chance-to-live": r".*MY CHANCE TO LIVE",
    "story-student-of-life": r".*STUDENT OF LIFE",
    "story-crossing-the-river-of-denial": r".*CROSSING THE RIVER",
    "story-because-im-an-alcoholic": r".*BECAUSE I.*M AN ALCOHOLIC",
    "story-it-might-have-been-worse": r".*IT MIGHT HAVE BEEN",
    "story-tightrope": r".*TIGHTROPE",
    "story-flooded-with-feeling": r".*FLOODED WITH FEELING",
    "story-winner-takes-all": r".*WINNER TAKES ALL",
    "story-me-an-alcoholic": r".*ME AN ALCOHOLIC",
    "story-the-perpetual-quest": r".*PERPETUAL QUEST",
    "story-a-drunk-like-you": r".*DRUNK, LIKE YOU",
    "story-acceptance-was-the-answer": r".*ACCEPTANCE WAS",
    "story-window-of-opportunity": r".*WINDOW OF OPPORTUNITY",
    "story-my-bottle-my-resentments-and-me": r".*MY BOTTLE.*MY RESENTMENTS",
    "story-he-lived-only-to-drink": r".*HE LIVED ONLY TO DRINK",
    "story-safe-haven": r".*SAFE HAVEN",
    "story-listening-to-the-wind": r".*LISTENING TO THE WIND",
    "story-twice-gifted": r".*TWICE GIFTED",
    "story-building-a-new-life": r".*BUILDING A NEW LIFE",
    "story-on-the-move": r".*ON THE MOVE",
    "story-a-vision-of-recovery": r".*VISION OF RECOVERY",
    "story-gutter-bravado": r".*GUTTER BRAVADO",
    "story-empty-on-the-inside": r".*EMPTY ON THE INSIDE",
    "story-grounded": r".*GROUNDED$",
    "story-another-chance": r".*ANOTHER CHANCE",
    "story-a-late-start": r".*A LATE START",
    "story-freedom-from-bondage": r".*FREEDOM FROM BONDAGE",
    "story-aa-taught-him-to-handle-sobriety": r".*A\.A\. TAUGHT HIM",
    "appendix-i-the-aa-tradition": r".*APPENDICES.*THE A\.A\. TRADITION",
    "appendix-ii-spiritual-experience": r".*II SPIRITUAL EXPERIENCE",
    "appendix-iii-the-medical-view-on-aa": r".*III THE MEDICAL VIEW",
    "appendix-iv-the-lasker-award": r".*IV THE LASKER AWARD",
    "appendix-v-the-religious-view-on-aa": r".*V THE RELIGIOUS VIEW",
    "appendix-vi-how-to-get-in-touch-with-aa": r".*VI HOW TO GET IN TOUCH",
    "appendix-vii-the-twelve-concepts": r".*VII THE TWELVE CONCEPTS",
    "appendix-aa-pamphlets": r"A\.A\. Pamphlets",
}

# Parse m_009.txt into tagged blocks
lines = src.read_text().splitlines()
blocks = []  # (kind, text)
i = 0
while i < len(lines):
    line = lines[i]
    m = re.match(r'^\[\[(\w[\w-]*)\]\]$', line)
    if m:
        kind = m.group(1)
        i += 1
        # Collect content lines until next tag or blank
        content = []
        while i < len(lines) and lines[i].strip() and not re.match(r'^\[\[.+\]\]$', lines[i]):
            content.append(lines[i])
            i += 1
        text = '\n'.join(content)
        blocks.append((kind, text))
    elif line.strip() == '':
        i += 1
    else:
        # Untagged line (shouldn't happen)
        blocks.append(('paragraph', line))
        i += 1

# Assign blocks to sections by finding heading blocks that match section patterns
section_starts = {}  # block_index -> section_id
matched = set()

for bi, (kind, text) in enumerate(blocks):
    if kind != 'heading':
        continue
    for sid, skind, stitle in SECTIONS:
        if sid in matched:
            continue
        pattern = SECTION_HEADINGS.get(sid)
        if pattern and re.match(pattern, text):
            section_starts[bi] = sid
            matched.add(sid)
            break

# copyright-info starts at block 0 (no heading)
if "copyright-info" not in matched:
    section_starts[0] = "copyright-info"
    matched.add("copyright-info")

remaining_sections = [s for s in SECTIONS if s[0] not in matched]

# Build sections
section_map = {s[0]: s for s in SECTIONS}
sorted_starts = sorted(section_starts.items())

output_sections = []
for idx, (start_bi, sid) in enumerate(sorted_starts):
    end_bi = sorted_starts[idx + 1][0] if idx + 1 < len(sorted_starts) else len(blocks)
    s_id, s_kind, s_title = section_map[sid]

    section_blocks = []
    for bi in range(start_bi, end_bi):
        bkind, btext = blocks[bi]
        block_id = f"{s_id}-{bkind[0]}{len(section_blocks)+1:03d}"
        section_blocks.append({
            "id": block_id,
            "kind": bkind,
            "text": btext,
            "pdfPage": 0,  # We don't have page info
        })

    section = {
        "id": s_id,
        "kind": s_kind,
        "title": s_title,
        "pdfPageStart": 0,
        "pdfPageEnd": 0,
        "bookPageStart": 0,
        "bookPageEnd": 0,
        "blocks": section_blocks,
    }
    output_sections.append(section)

output = {
    "edition": "4th",
    "sourcePdf": "legacy/assets/AA-BigBook-4th-Edition.pdf",
    "extractedAt": "2026-04-18T00:00:00Z",
    "sections": output_sections,
}

# Stats
print(f"Sections: {len(output_sections)}/{len(SECTIONS)}")
if remaining_sections:
    print(f"Unmatched sections: {[s[0] for s in remaining_sections]}")
total_blocks = sum(len(s['blocks']) for s in output_sections)
print(f"Total blocks: {total_blocks}")

# Save
out_path = here / "m_009.json"
json.dump(output, open(out_path, 'w'), indent=2, ensure_ascii=False)
print(f"Written to {out_path.name}")
