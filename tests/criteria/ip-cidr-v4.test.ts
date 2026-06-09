import { describe, it, expect } from 'vitest'
import { ipCidrV4 } from '../../src/criteria/ip-cidr-v4.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (clientIp: string): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp
})

describe('ipCidrV4', () => {
  it('returns true for IP within CIDR', () => {
    expect(ipCidrV4(['10.0.0.0/8'])(req('10.0.0.1'))).toBe(true)
  })

  it('returns false for IP outside CIDR', () => {
    expect(ipCidrV4(['10.0.0.0/8'])(req('192.168.1.1'))).toBe(false)
  })

  it('supports multiple CIDRs', () => {
    const fn = ipCidrV4(['10.0.0.0/8', '172.16.0.0/12'])
    expect(fn(req('172.16.0.1'))).toBe(true)
    expect(fn(req('8.8.8.8'))).toBe(false)
  })

  it('matches exact host /32', () => {
    expect(ipCidrV4(['1.2.3.4/32'])(req('1.2.3.4'))).toBe(true)
    expect(ipCidrV4(['1.2.3.4/32'])(req('1.2.3.5'))).toBe(false)
  })

  it('returns false for empty list', () => {
    expect(ipCidrV4([])(req('10.0.0.1'))).toBe(false)
  })

  it('handles /0 (matches all)', () => {
    expect(ipCidrV4(['0.0.0.0/0'])(req('8.8.8.8'))).toBe(true)
  })
})
