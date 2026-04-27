import { describe, it, expect } from 'vitest'
import { methodIs } from '../../src/criteria/method-is.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (method: string): HttpRequest => ({
  uri: '/', method, protocol: 'https', querystring: {}, headers: {}, clientIp: '1.1.1.1'
})

describe('methodIs', () => {
  it('returns true for matching method', () => {
    expect(methodIs('GET')(req('GET'))).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(methodIs('GET')(req('get'))).toBe(true)
  })

  it('returns false for non-matching method', () => {
    expect(methodIs('GET')(req('POST'))).toBe(false)
  })

  it('supports multiple methods', () => {
    const fn = methodIs('GET', 'HEAD')
    expect(fn(req('HEAD'))).toBe(true)
    expect(fn(req('POST'))).toBe(false)
  })
})
