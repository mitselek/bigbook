export interface SectionMapEntry {
  canonicalSlug: string
  enSectionId: string | null
  etSectionId: string | null
}

const NON_STORY_ENTRIES: readonly SectionMapEntry[] = [
  { canonicalSlug: 'copyright', enSectionId: 'copyright-info', etSectionId: 'copyright-info' },
  { canonicalSlug: 'preface', enSectionId: 'preface', etSectionId: 'eessona' },
  { canonicalSlug: 'fw1', enSectionId: 'foreword-1st-edition', etSectionId: 'eessona-1st' },
  { canonicalSlug: 'fw2', enSectionId: 'foreword-2nd-edition', etSectionId: 'eessona-2nd' },
  { canonicalSlug: 'fw3', enSectionId: 'foreword-3rd-edition', etSectionId: 'eessona-3rd' },
  { canonicalSlug: 'fw4', enSectionId: 'foreword-4th-edition', etSectionId: 'eessona-4th' },
  { canonicalSlug: 'arsti', enSectionId: 'doctors-opinion', etSectionId: 'arsti-arvamus' },
  { canonicalSlug: 'ch01', enSectionId: 'ch01-bills-story', etSectionId: 'ch01-billi-lugu' },
  {
    canonicalSlug: 'ch02',
    enSectionId: 'ch02-there-is-a-solution',
    etSectionId: 'ch02-lahendus-on-olemas',
  },
  {
    canonicalSlug: 'ch03',
    enSectionId: 'ch03-more-about-alcoholism',
    etSectionId: 'ch03-alkoholismist-lahemalt',
  },
  { canonicalSlug: 'ch04', enSectionId: 'ch04-we-agnostics', etSectionId: 'ch04-meie-agnostikud' },
  {
    canonicalSlug: 'ch05',
    enSectionId: 'ch05-how-it-works',
    etSectionId: 'ch05-kuidas-see-toetab',
  },
  { canonicalSlug: 'ch06', enSectionId: 'ch06-into-action', etSectionId: 'ch06-tegutsema' },
  {
    canonicalSlug: 'ch07',
    enSectionId: 'ch07-working-with-others',
    etSectionId: 'ch07-too-teistega',
  },
  { canonicalSlug: 'ch08', enSectionId: 'ch08-to-wives', etSectionId: 'ch08-naistele' },
  {
    canonicalSlug: 'ch09',
    enSectionId: 'ch09-the-family-afterward',
    etSectionId: 'ch09-perekond-hiljem',
  },
  { canonicalSlug: 'ch10', enSectionId: 'ch10-to-employers', etSectionId: 'ch10-tooandjatele' },
  {
    canonicalSlug: 'ch11',
    enSectionId: 'ch11-a-vision-for-you',
    etSectionId: 'ch11-tulevikupilt-teie-jaoks',
  },
  {
    canonicalSlug: 'a-i',
    enSectionId: 'appendix-i-the-aa-tradition',
    etSectionId: 'appendix-i-aa-traditsioonid',
  },
  {
    canonicalSlug: 'a-ii',
    enSectionId: 'appendix-ii-spiritual-experience',
    etSectionId: 'appendix-ii-vaimne-kogemus',
  },
  {
    canonicalSlug: 'a-iii',
    enSectionId: 'appendix-iii-the-medical-view-on-aa',
    etSectionId: 'appendix-iii-meditsiiniline-vaade-aa-le',
  },
  {
    canonicalSlug: 'a-iv',
    enSectionId: 'appendix-iv-the-lasker-award',
    etSectionId: 'appendix-iv-lasker-award',
  },
  {
    canonicalSlug: 'a-v',
    enSectionId: 'appendix-v-the-religious-view-on-aa',
    etSectionId: 'appendix-v-religioosne-vaade-aa-le',
  },
  {
    canonicalSlug: 'a-vi',
    enSectionId: 'appendix-vi-how-to-get-in-touch-with-aa',
    etSectionId: 'appendix-vi-kuidas-aaga-uhendust-votta',
  },
  {
    canonicalSlug: 'a-vii',
    enSectionId: 'appendix-vii-the-twelve-concepts',
    etSectionId: 'appendix-vii-kaksteist-kontseptsiooni',
  },
  { canonicalSlug: 'a-pamphlets', enSectionId: 'appendix-aa-pamphlets', etSectionId: null },
]

const STORY_ENTRIES: readonly SectionMapEntry[] = [] // populated in task 4

export const SECTION_MAP: readonly SectionMapEntry[] = [
  ...NON_STORY_ENTRIES.slice(0, 18), // copyright..ch11 (18 entries)
  ...STORY_ENTRIES, // s01..s42 (task 4)
  ...NON_STORY_ENTRIES.slice(18), // a-i..a-pamphlets (8 entries)
]

const enIndex = new Map(
  SECTION_MAP.filter((e) => e.enSectionId !== null).map((e) => [e.enSectionId as string, e]),
)
const etIndex = new Map(
  SECTION_MAP.filter((e) => e.etSectionId !== null).map((e) => [e.etSectionId as string, e]),
)
const slugIndex = new Map(SECTION_MAP.map((e) => [e.canonicalSlug, e]))

export function slugForEnSection(enId: string): string | null {
  return enIndex.get(enId)?.canonicalSlug ?? null
}

export function slugForEtSection(etId: string): string | null {
  return etIndex.get(etId)?.canonicalSlug ?? null
}

export function entryForSlug(slug: string): SectionMapEntry | null {
  return slugIndex.get(slug) ?? null
}
