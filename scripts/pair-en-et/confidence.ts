export interface ClassifyResult {
  confidence: 'high' | 'low'
  notes?: string
}

export function lengthRatio(_enText: string, _etText: string): number {
  return NaN
}

export function classify(_enText: string, _etText: string): ClassifyResult {
  return { confidence: 'low' }
}
