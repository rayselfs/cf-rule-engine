import { describe, it, expect } from 'vitest'
import { ipCidr } from '../../src/criteria/ip-cidr.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (clientIp: string): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp
})

describe('ipCidr', () => {
  it('returns true for IP within CIDR', () => {
    expect(ipCidr(['10.0.0.0/8'])(req('10.0.0.1'))).toBe(true)
  })

  it('returns false for IP outside CIDR', () => {
    expect(ipCidr(['10.0.0.0/8'])(req('192.168.1.1'))).toBe(false)
  })

  it('supports multiple CIDRs', () => {
    const fn = ipCidr(['10.0.0.0/8', '172.16.0.0/12'])
    expect(fn(req('172.16.0.1'))).toBe(true)
    expect(fn(req('8.8.8.8'))).toBe(false)
  })

  it('matches exact host /32', () => {
    expect(ipCidr(['1.2.3.4/32'])(req('1.2.3.4'))).toBe(true)
    expect(ipCidr(['1.2.3.4/32'])(req('1.2.3.5'))).toBe(false)
  })

  it('IPv6: returns true for IPv6 within /48', () => {
    expect(ipCidr(['2001:db8:1::/48'])(req('2001:db8:1::1'))).toBe(true)
  })

  it('IPv6: returns false for IPv6 outside /48', () => {
    expect(ipCidr(['2001:db8:1::/48'])(req('2001:db8:2::1'))).toBe(false)
  })

  it('IPv6: supports mixed IPv4 and IPv6 CIDRs', () => {
    const fn = ipCidr(['10.0.0.0/8', '2001:db8::/32'])
    expect(fn(req('2001:db8::1'))).toBe(true)
    expect(fn(req('fe80::1'))).toBe(false)
  })

  it('IPv6: matches exact /128', () => {
    expect(ipCidr(['2001:db8::1/128'])(req('2001:db8::1'))).toBe(true)
    expect(ipCidr(['2001:db8::1/128'])(req('2001:db8::2'))).toBe(false)
  })
})

