import { describe, it, expect } from 'vitest'
import { uaContains } from '../../src/criteria/user-agent-contains.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (ua?: string): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {},
  headers: ua ? { 'user-agent': { value: ua } } : {},
  clientIp: '1.2.3.4',
})

describe('uaContains', () => {
  it('returns true when UA contains keyword', () => {
    expect(uaContains(['Prerender'])(req('Mozilla/5.0 Prerender/1.0'))).toBe(true)
  })

  it('returns false when UA does not contain keyword', () => {
    expect(uaContains(['Prerender'])(req('Mozilla/5.0 Chrome/120'))).toBe(false)
  })

  it('matches any keyword in list', () => {
    const fn = uaContains(['HTCVRSDET', 'Prerender'])
    expect(fn(req('HTCVRSDET-Crawler'))).toBe(true)
    expect(fn(req('Prerender/2.0'))).toBe(true)
    expect(fn(req('Mozilla/5.0'))).toBe(false)
  })

  it('returns false when user-agent header is absent', () => {
    expect(uaContains(['Prerender'])(req())).toBe(false)
  })

  it('is case-sensitive', () => {
    expect(uaContains(['prerender'])(req('Mozilla/5.0 Prerender/1.0'))).toBe(false)
    expect(uaContains(['Prerender'])(req('Mozilla/5.0 Prerender/1.0'))).toBe(true)
  })

  it('returns false for empty keyword list', () => {
    expect(uaContains([])(req('Mozilla/5.0'))).toBe(false)
  })
})
