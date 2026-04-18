/**
 * Turn normalized section text into a typed Block[].
 */

import type { Block } from './types'

export interface SegmentContext {
  sectionTitle: string
  sectionId: string
  pdfPageStart: number
}

export function segmentBlocks(_text: string, _ctx: SegmentContext): Block[] {
  throw new Error('not implemented')
}
