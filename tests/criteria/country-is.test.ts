import { describe, it, expect } from 'vitest'
import { countryIs } from '../../src/criteria/country-is.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (country?: string): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {},
  headers: country ? { 'cloudfront-viewer-country': { value: country } } : {},
  clientIp: '1.1.1.1'
})

describe('countryIs', () => {
  it('returns true for matching country code', () => {
    expect(countryIs(['TW'])(req('TW'))).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(countryIs(['TW'])(req('tw'))).toBe(true)
  })

  it('returns false for non-matching country', () => {
    expect(countryIs(['TW'])(req('US'))).toBe(false)
  })

  it('returns false when header is missing', () => {
    expect(countryIs(['TW'])(req())).toBe(false)
  })

  it('supports multiple country codes', () => {
    const fn = countryIs(['TW', 'JP'])
    expect(fn(req('JP'))).toBe(true)
    expect(fn(req('US'))).toBe(false)
  })
})
