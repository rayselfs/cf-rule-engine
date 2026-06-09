import { describe, it, expect } from 'vitest'
import { ipExact } from '../../src/criteria/ip-exact.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (clientIp: string): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp
})

describe('ipExact', () => {
  it('returns true for matching IP', () => {
    expect(ipExact(['1.2.3.4'])(req('1.2.3.4'))).toBe(true)
  })

  it('returns false for non-matching IP', () => {
    expect(ipExact(['1.2.3.4'])(req('1.2.3.5'))).toBe(false)
  })

  it('supports multiple IPs', () => {
    const fn = ipExact(['10.0.0.1', '10.0.0.2'])
    expect(fn(req('10.0.0.1'))).toBe(true)
    expect(fn(req('10.0.0.2'))).toBe(true)
    expect(fn(req('10.0.0.3'))).toBe(false)
  })

  it('supports IPv6 addresses', () => {
    expect(ipExact(['2001:db8::1'])(req('2001:db8::1'))).toBe(true)
    expect(ipExact(['2001:db8::1'])(req('2001:db8::2'))).toBe(false)
  })

  it('returns false for empty list', () => {
    expect(ipExact([])(req('1.2.3.4'))).toBe(false)
  })

  it('is exact — does not match subnet peers', () => {
    expect(ipExact(['10.0.0.1'])(req('10.0.0.2'))).toBe(false)
  })
})
