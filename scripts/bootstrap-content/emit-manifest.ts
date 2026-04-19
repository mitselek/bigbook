import type { Manifest, ManifestSection, SectionRenderPlan } from './types'

export function buildManifest(plans: readonly SectionRenderPlan[], generatedAt: string): Manifest {
  const sections: ManifestSection[] = plans.map((p) => ({
    canonicalSlug: p.canonicalSlug,
    group: p.group,
    title: p.title,
    paraIds: p.en.map((b) => b.paraId),
    pdfPageStart: p.pdfPageStart,
    pdfPageEnd: p.pdfPageEnd,
  }))
  return { version: '1.1', generatedAt, sections }
}
