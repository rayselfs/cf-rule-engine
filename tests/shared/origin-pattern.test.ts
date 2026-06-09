import { describe, it, expect } from 'vitest'
import { matchesOriginPattern } from '../../src/shared/origin-pattern.js'

describe('matchesOriginPattern', () => {
  it('returns true for wildcard *', () => {
    expect(matchesOriginPattern('https://example.com', '*')).toBe(true)
  })

  it('returns true for exact match', () => {
    expect(matchesOriginPattern('https://example.com', 'https://example.com')).toBe(true)
  })

  it('returns false for non-matching exact pattern', () => {
    expect(matchesOriginPattern('https://other.com', 'https://example.com')).toBe(false)
  })

  it('matches wildcard subdomain pattern', () => {
    expect(matchesOriginPattern('https://app.viverse.com', 'https://*.viverse.com')).toBe(true)
  })

  it('does not match when subdomain pattern does not fit', () => {
    expect(matchesOriginPattern('https://viverse.com', 'https://*.viverse.com')).toBe(false)
  })

  it('is case-sensitive', () => {
    expect(matchesOriginPattern('https://Example.com', 'https://example.com')).toBe(false)
  })

  it('does not match partial prefix without wildcard', () => {
    expect(matchesOriginPattern('https://example.com.evil', 'https://example.com')).toBe(false)
  })

  it('caches regexp for repeated calls with same pattern', () => {
    const pattern = 'https://*.viverse.com'
    expect(matchesOriginPattern('https://a.viverse.com', pattern)).toBe(true)
    expect(matchesOriginPattern('https://b.viverse.com', pattern)).toBe(true)
  })
})
