import type { ExtractionBlock, Pair, UnpairedBlock } from './types'

export interface PairBlocksResult {
  pairs: Pair[]
  unpaired: UnpairedBlock[]
  diagnostics: string[]
}

export function pairBlocks(
  _canonicalSlug: string,
  _enBlocks: readonly ExtractionBlock[],
  _etBlocks: readonly ExtractionBlock[],
): PairBlocksResult {
  return { pairs: [], unpaired: [], diagnostics: [] }
}
