export interface ClassifyResult {
  confidence: 'high' | 'low'
  notes?: string
}

const LOWER = 0.55
const UPPER = 1.6

export function lengthRatio(enText: string, etText: string): number {
  return etText.length / enText.length
}

export function classify(enText: string, etText: string): ClassifyResult {
  if (enText.length === 0 || etText.length === 0) {
    return { confidence: 'low', notes: 'empty text on one or both sides' }
  }
  const r = lengthRatio(enText, etText)
  if (r >= LOWER && r <= UPPER) {
    return { confidence: 'high' }
  }
  return { confidence: 'low', notes: `length-ratio ${r.toFixed(2)}` }
}
