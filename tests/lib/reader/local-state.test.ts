import { describe, it, expect, beforeEach } from 'vitest'
import { getLastParaId, setLastParaId } from '../../../src/lib/reader/local-state'

describe('local-state', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no value stored', () => {
    expect(getLastParaId()).toBeNull()
  })

  it('round-trips a para-id', () => {
    setLastParaId('ch05-p003')
    expect(getLastParaId()).toBe('ch05-p003')
  })

  it('overwrites previous value', () => {
    setLastParaId('ch01-p001')
    setLastParaId('ch08-p012')
    expect(getLastParaId()).toBe('ch08-p012')
  })

  it('returns null gracefully when localStorage throws on read', () => {
    const orig = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new DOMException('SecurityError')
    }
    expect(getLastParaId()).toBeNull()
    Storage.prototype.getItem = orig
  })

  it('does not throw when localStorage throws on write', () => {
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new DOMException('QuotaExceededError')
    }
    expect(() => setLastParaId('ch01-p001')).not.toThrow()
    Storage.prototype.setItem = orig
  })
})
